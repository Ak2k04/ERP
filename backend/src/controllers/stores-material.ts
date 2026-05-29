import { Request, Response } from 'express';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';
import ExcelJS from 'exceljs';
import logger from '../utils/logger';

// --- Category Controllers ---

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { materials: true } }
    },
    orderBy: { name: 'asc' }
  });

  res.status(200).json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, color } = req.body;
  
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw new AppError('Category already exists', 400);

  const category = await prisma.category.create({
    data: { name, color: color || '#3b82f6' }
  });

  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, color } = req.body;

  const category = await prisma.category.update({
    where: { id: String(id) },
    data: { name, color }
  });

  res.status(200).json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = (await prisma.category.findUnique({
    where: { id: String(id) },
    include: { _count: { select: { materials: true } } }
  })) as any;

  if (!category) throw new AppError('Category not found', 404);
  if (category._count.materials > 0) {
    throw new AppError(`Cannot delete category with ${category._count.materials} materials assigned`, 400);
  }

  await prisma.category.delete({ where: { id: String(id) } });
  res.status(200).json({ success: true, message: 'Category deleted' });
});

// --- StoresMaterial Controllers ---

export const getMaterials = asyncHandler(async (req: Request, res: Response) => {
  const { search, categoryId, status, page = '1', limit = '25' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { partNumber: { contains: String(search) } },
      { productName: { contains: String(search) } },
    ];
  }
  if (categoryId) where.categoryId = String(categoryId);
  
  // Status filtering logic
  if (status === 'LOW_STOCK') {
    where.AND = [
      { closingStock: { lte: prisma.storesMaterial.fields.reorderLevel } },
      { closingStock: { gt: prisma.storesMaterial.fields.minimumStock } }
    ];
  } else if (status === 'CRITICAL') {
    where.closingStock = { lte: prisma.storesMaterial.fields.minimumStock };
  } else if (status === 'OUT_OF_STOCK') {
    where.closingStock = 0;
  }

  const [materials, total] = await Promise.all([
    prisma.storesMaterial.findMany({
      where,
      skip,
      take: Number(limit),
      include: { category: true },
      orderBy: { partNumber: 'asc' }
    }),
    prisma.storesMaterial.count({ where })
  ]);

  res.status(200).json({
    success: true,
    data: materials,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    }
  });
});

export const importStoresExcel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer as any);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) throw new AppError('Invalid Excel format', 400);

  // Seeding/Ensuring default categories exist
  const DEFAULT_CATEGORIES = [
    { name: 'consumables and tools', color: '#3b82f6' },
    { name: 'display', color: '#10b981' },
    { name: 'enclosure', color: '#f59e0b' },
    { name: 'fuse and power supply', color: '#ef4444' },
    { name: 'keypad & stickers', color: '#8b5cf6' },
    { name: 'MOV LED Connector', color: '#ec4899' },
    { name: 'PCB', color: '#06b6d4' },
    { name: 'resistor,capacitor,diode&transistor ,ic', color: '#14b8a6' },
    { name: 'switch and modules', color: '#6366f1' },
    { name: 'others', color: '#6b7280' },
  ];

  async function ensureCategories() {
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: cat
      });
    }
  }

  function detectCategoryFromFilename(filename: string): string {
    const name = filename.toLowerCase();
    if (name.includes('consumable') || name.includes('tools')) return 'consumables and tools';
    if (name.includes('display') || name.includes('displau')) return 'display';
    if (name.includes('encloser') || name.includes('enclosure')) return 'enclosure';
    if (name.includes('fuse') || name.includes('power')) return 'fuse and power supply';
    if (name.includes('keypad') || name.includes('sticker') || name.includes('stikcer')) return 'keypad & stickers';
    if (name.includes('mov') || name.includes('led') || name.includes('connector')) return 'MOV LED Connector';
    if (name.includes('pcb')) return 'PCB';
    if (name.includes('resistor') || name.includes('capacitor') || name.includes('diode') || name.includes('transistor') || name.includes('ic')) return 'resistor,capacitor,diode&transistor ,ic';
    if (name.includes('switch') || name.includes('module')) return 'switch and modules';
    return 'others';
  }

  await ensureCategories();

  let categoryId: string | null = null;
  const reqCategoryId = req.body.categoryId;

  if (reqCategoryId && reqCategoryId !== 'auto') {
    categoryId = reqCategoryId;
  } else {
    const originalName = req.file ? req.file.originalname : '';
    const catName = detectCategoryFromFilename(originalName);
    const dbCat = await prisma.category.findUnique({ where: { name: catName } });
    if (dbCat) {
      categoryId = dbCat.id;
    }
  }

  const materials: any[] = [];
  const errors: string[] = [];

  // Auto-detect header row
  let headerRowIndex = 1;
  for (let r = 1; r <= 15; r++) {
    const rowVal = worksheet.getRow(r).getCell(2).value;
    if (rowVal && rowVal.toString().trim().toLowerCase() === 'part number') {
      headerRowIndex = r;
      break;
    }
  }

  // Parse dates if new format
  const headerRow = worksheet.getRow(headerRowIndex);
  const dates: { col: number; date: Date }[] = [];
  if (headerRowIndex === 10) {
    for (let col = 7; col <= 37; col++) {
      const val = headerRow.getCell(col).value;
      if (val) {
        let dateObj: Date | null = null;
        if (val instanceof Date) {
          dateObj = val;
        } else {
          const parsed = Date.parse(val.toString());
          if (!isNaN(parsed)) {
            dateObj = new Date(parsed);
          }
        }
        if (dateObj) {
          dates.push({ col, date: dateObj });
        }
      }
    }
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return; // Skip headers/metadata

    try {
      const getStr = (idx: number) => {
        const val = row.getCell(idx).value;
        if (!val) return '';
        if (typeof val === 'object' && 'result' in val) return val.result?.toString() || '';
        return val.toString();
      };

      const getFloat = (idx: number) => {
        const val = row.getCell(idx).value;
        if (!val) return 0;
        let num: number;
        if (typeof val === 'object' && 'result' in val) {
          num = parseFloat(val.result?.toString() || '0');
        } else {
          num = parseFloat(val.toString());
        }
        return isNaN(num) ? 0 : num;
      };

      const storageLocation = getStr(1);
      const partNumber = getStr(2);
      const productName = getStr(3);
      const rate = getFloat(4);
      const unit = getStr(5);
      const openingStock = getFloat(6);

      let closingStock = 0;
      let minStock = 0;
      let reorderLevel = 0;
      let maxStock = 0;

      if (headerRowIndex === 10) {
        closingStock = getFloat(38);
        minStock = getFloat(39);
        reorderLevel = getFloat(40);
        maxStock = getFloat(41);
      } else {
        closingStock = getFloat(7);
        minStock = getFloat(8);
        reorderLevel = getFloat(9);
        maxStock = getFloat(10);
      }

      if (!partNumber || !productName || partNumber === 'Part Number' || productName === 'Product Name') {
        return;
      }

      materials.push({
        storageLocation,
        partNumber,
        productName,
        unitRate: rate,
        unit,
        openingStock,
        closingStock,
        minimumStock: minStock,
        reorderLevel,
        maximumStock: maxStock,
        categoryId,
        rowNumber,
      });
    } catch (err: any) {
      errors.push(`Row ${rowNumber}: ${err.message}`);
    }
  });

  // Upsert materials and populate daily ledger
  for (const mat of materials) {
    const { rowNumber, ...matData } = mat;
    const createdMat = await prisma.storesMaterial.upsert({
      where: { partNumber: matData.partNumber },
      update: matData,
      create: matData
    });

    if (headerRowIndex === 10) {
      // Clear old ledger entries to prevent duplicates
      await prisma.dailyLedger.deleteMany({
        where: { materialId: createdMat.id }
      });

      const row = worksheet.getRow(rowNumber);
      let runningBalance = matData.openingStock;

      // Seeding Opening Balance entry
      if (matData.openingStock !== 0) {
        const firstDate = dates.length > 0 ? dates[0].date : new Date('2026-01-01');
        await prisma.dailyLedger.create({
          data: {
            materialId: createdMat.id,
            date: firstDate,
            movementType: 'OPENING_BALANCE',
            quantity: matData.openingStock,
            runningBalance: matData.openingStock,
            referenceType: 'OPENING_BALANCE',
            notes: 'Opening Balance (Imported)',
            createdById: (req as any).user?.id || 'system'
          }
        });
      }

      // Populate Date Transactions
      for (const d of dates) {
        const cellValue = row.getCell(d.col).value;
        if (cellValue !== null && cellValue !== undefined) {
          let num: number;
          if (typeof cellValue === 'object' && 'result' in cellValue) {
            num = parseFloat(cellValue.result?.toString() || '0');
          } else {
            num = parseFloat(cellValue.toString());
          }
          const qty = isNaN(num) ? 0 : num;
          
          runningBalance += qty;
          
          if (qty !== 0) {
            await prisma.dailyLedger.create({
              data: {
                materialId: createdMat.id,
                date: d.date,
                movementType: qty > 0 ? 'IN' : 'OUT',
                quantity: qty,
                runningBalance: runningBalance,
                referenceType: qty > 0 ? 'MANUAL_IN' : 'MANUAL_OUT',
                notes: 'Daily ledger entry (Imported)',
                createdById: (req as any).user?.id || 'system'
              }
            });
          }
        }
      }
    }
  }

  res.status(200).json({
    success: true,
    message: `Imported ${materials.length} materials successfully`,
    errors: errors.length > 0 ? errors : undefined
  });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { materialId, type, quantity, reason, date } = req.body;
  const qty = parseFloat(quantity);

  const material = await prisma.storesMaterial.findUnique({ where: { id: materialId } });
  if (!material) throw new AppError('Material not found', 404);

  let newClosingStock = material.closingStock;
  if (type === 'IN') newClosingStock += qty;
  else if (type === 'OUT') newClosingStock -= qty;
  else if (type === 'ADJUSTMENT' || type === 'OPENING_BALANCE') newClosingStock = qty;

  const updatedMaterial = await prisma.storesMaterial.update({
    where: { id: materialId },
    data: {
      closingStock: newClosingStock,
      lastMovementAt: new Date(date),
      lastMovementType: type
    }
  });

  // Create Ledger Entry
  await prisma.dailyLedger.create({
    data: {
      materialId,
      date: new Date(date),
      movementType: type,
      quantity: type === 'OUT' ? -qty : qty,
      runningBalance: newClosingStock,
      notes: reason,
      createdById: (req as any).user?.id || 'system'
    }
  });

  res.status(200).json({ success: true, data: updatedMaterial });
});

export const createMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { 
    partNumber, 
    productName, 
    categoryId, 
    storageLocation, 
    unitRate, 
    unit, 
    openingStock, 
    minimumStock, 
    reorderLevel, 
    maximumStock 
  } = req.body;
  
  const existing = await prisma.storesMaterial.findUnique({ where: { partNumber } });
  if (existing) throw new AppError('Material with this Part Number already exists', 400);

  const material = await prisma.storesMaterial.create({
    data: {
      partNumber,
      productName,
      categoryId: categoryId || null,
      storageLocation: storageLocation || null,
      unitRate: unitRate ? parseFloat(unitRate) : null,
      unit: unit || 'pcs',
      openingStock: openingStock ? parseFloat(openingStock) : 0,
      closingStock: openingStock ? parseFloat(openingStock) : 0,
      minimumStock: minimumStock ? parseFloat(minimumStock) : null,
      reorderLevel: reorderLevel ? parseFloat(reorderLevel) : null,
      maximumStock: maximumStock ? parseFloat(maximumStock) : null,
    },
    include: { category: true }
  });

  // Seed ledger entry if openingStock is greater than 0
  if (openingStock && parseFloat(openingStock) !== 0) {
    await prisma.dailyLedger.create({
      data: {
        materialId: material.id,
        date: new Date(),
        movementType: 'OPENING_BALANCE',
        quantity: parseFloat(openingStock),
        runningBalance: parseFloat(openingStock),
        referenceType: 'OPENING_BALANCE',
        notes: 'Opening Balance (Manual Creation)',
        createdById: (req as any).user?.id || 'system'
      }
    });
  }

  res.status(201).json({ success: true, data: material });
});

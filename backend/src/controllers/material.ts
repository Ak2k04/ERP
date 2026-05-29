import { Request, Response } from 'express';
import exceljs from 'exceljs';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export const getMaterials = asyncHandler(async (req: Request, res: Response) => {
  const { search, storageLocation, category, page = '1', limit = '25' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { partNumber: { contains: String(search) } },
      { productName: { contains: String(search) } },
    ];
  }
  if (storageLocation) {
    where.storageLocation = String(storageLocation);
  }
  if (category) {
    where.category = String(category);
  }

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { partNumber: 'asc' },
    }),
    prisma.material.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: materials,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const createMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await prisma.material.create({
    data: req.body,
  });

  res.status(201).json({
    success: true,
    data: material,
  });
});

export const updateMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const material = await prisma.material.update({
    where: { id: String(id) },
    data: req.body,
  });

  res.status(200).json({
    success: true,
    data: material,
  });
});

export const deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if used in BOM
  const usageCount = await prisma.bomItem.count({
    where: { materialId: String(id) },
  });

  if (usageCount > 0) {
    throw new AppError('Cannot delete material used in existing BOMs', 400);
  }

  await prisma.material.delete({ where: { id: String(id) } });

  res.status(200).json({
    success: true,
    message: 'Material deleted successfully',
  });
});

export const importExcel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const { sheetName, conflictAction, category } = req.body; 
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.load(req.file.buffer as any);

  const sheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  if (!sheet) {
    throw new AppError('Selected sheet not found', 400);
  }

  const results = {
    new: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const rowData: any[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) rowData.push({ row, rowNumber });
  });

  for (const { row, rowNumber } of rowData) {
    try {
      const getVal = (col: number) => {
        const cell = row.getCell(col);
        if (!cell || cell.value === null || cell.value === undefined) return "";
        return cell.value.toString().trim();
      };

      const storageLocation = getVal(1);
      const partNumber = getVal(2);
      const productName = getVal(3);
      const unitRate = parseFloat(getVal(4)) || 0;
      const unit = getVal(5);
      const currentStock = parseFloat(getVal(6)) || 0;
      const minimumStock = parseFloat(getVal(7)) || 0;
      const reorderLevel = parseFloat(getVal(8)) || 0;
      const maximumStock = parseFloat(getVal(9)) || 0;

      // Define footer keywords to skip silently
      const footerKeywords = ['sign', 'date', 'designation', 'functions', 'name', 'reviewed by', 'prepared by'];
      const isFooter = footerKeywords.some(k => 
        partNumber.toLowerCase().includes(k) || 
        productName.toLowerCase().includes(k) ||
        storageLocation.toLowerCase().includes(k)
      );

      if (isFooter) continue;

      // Skip rows that are essentially empty
      if (!partNumber && !productName) continue;

      if (!partNumber || !productName) {
        console.warn(`[Import] Skipping Row ${rowNumber}: Missing critical data`, { partNumber, productName, storageLocation });
        results.errors.push(`Row ${rowNumber}: ${!partNumber ? 'Part Number' : 'Product Name'} is missing`);
        continue;
      }

      const existing = await prisma.material.findUnique({ where: { partNumber } });

      if (existing) {
        if (conflictAction === 'UPDATE') {
          await prisma.material.update({
            where: { partNumber },
            data: {
              category,
              storageLocation,
              productName,
              unitRate,
              unit,
              currentStock,
              minimumStock,
              reorderLevel,
              maximumStock,
            },
          });
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        await prisma.material.create({
          data: {
            category,
            storageLocation,
            partNumber,
            productName,
            unitRate,
            unit,
            currentStock,
            minimumStock,
            reorderLevel,
            maximumStock,
          },
        });
        results.new++;
      }
    } catch (error: any) {
      results.errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  }

  res.status(200).json({
    success: true,
    data: results,
  });
});

export const getDistinctStorageLocations = asyncHandler(async (req: Request, res: Response) => {
  const locations = await prisma.material.findMany({
    select: { storageLocation: true },
    distinct: ['storageLocation'],
    where: {
      AND: [
        { storageLocation: { not: null } },
        { storageLocation: { not: "" } }
      ]
    },
  });

  res.status(200).json({
    success: true,
    data: locations.map(l => l.storageLocation),
  });
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.material.findMany({
    select: { category: true },
    distinct: ['category'],
    where: {
      AND: [
        { category: { not: null } },
        { category: { not: "" } }
      ]
    },
  });

  res.status(200).json({
    success: true,
    data: categories.map(c => c.category),
  });
});

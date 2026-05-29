import { Request, Response } from 'express';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';
import ExcelJS from 'exceljs';

export const getLedgerEntries = asyncHandler(async (req: Request, res: Response) => {
  const { date, materialId, startDate, endDate } = req.query;
  
  const where: any = {};
  if (date) {
    const start = new Date(String(date));
    start.setHours(0, 0, 0, 0);
    const end = new Date(String(date));
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  } else if (startDate && endDate) {
    where.date = {
      gte: new Date(String(startDate)),
      lte: new Date(String(endDate))
    };
  }
  
  if (materialId) where.materialId = String(materialId);

  const entries = await prisma.dailyLedger.findMany({
    where,
    include: {
      material: {
        include: { category: true }
      }
    },
    orderBy: { date: 'desc' }
  });

  res.status(200).json({ success: true, data: entries });
});

export const importLedgerExcel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer as any);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) throw new AppError('Invalid Excel format', 400);

  const entries: any[] = [];
  const errors: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 1) return; // Skip header

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

      const getDate = (idx: number) => {
        const val = row.getCell(idx).value;
        if (!val) return new Date();
        if (val instanceof Date) return val;
        const d = new Date(val.toString());
        return isNaN(d.getTime()) ? new Date() : d;
      };

      const date = getDate(1);
      const partNumber = getStr(2);
      const type = getStr(3).toUpperCase() as any; // IN, OUT, ADJUSTMENT
      const qty = getFloat(4);
      const ref = getStr(5);
      const remarks = getStr(6);

      if (!partNumber || !qty) {
        if (partNumber !== 'Part Number') {
          errors.push(`Row ${rowNumber}: Part Number and Quantity are required`);
        }
        return;
      }

      entries.push({ date, partNumber, type, qty, ref, remarks });
    } catch (err: any) {
      errors.push(`Row ${rowNumber}: ${err.message}`);
    }
  });

  // Process entries
  let successCount = 0;
  for (const entry of entries) {
    try {
      const material = await prisma.storesMaterial.findUnique({
        where: { partNumber: entry.partNumber }
      });

      if (!material) {
        errors.push(`Material not found for Part Number: ${entry.partNumber}`);
        continue;
      }

      const movementType = ['IN', 'OUT', 'ADJUSTMENT', 'OPENING_BALANCE'].includes(entry.type) 
        ? entry.type 
        : (entry.qty >= 0 ? 'IN' : 'OUT');

      await prisma.$transaction(async (tx) => {
        // Update stock
        let newStock = material.closingStock;
        if (movementType === 'IN') newStock += Math.abs(entry.qty);
        else if (movementType === 'OUT') newStock -= Math.abs(entry.qty);
        else newStock = entry.qty; // Adjustment

        await tx.storesMaterial.update({
          where: { id: material.id },
          data: { 
            closingStock: newStock,
            lastMovementAt: entry.date,
            lastMovementType: movementType
          }
        });

        // Create ledger entry
        await tx.dailyLedger.create({
          data: {
            materialId: material.id,
            date: entry.date,
            movementType: movementType,
            quantity: movementType === 'OUT' ? -Math.abs(entry.qty) : Math.abs(entry.qty),
            runningBalance: newStock,
            referenceCode: entry.ref,
            notes: entry.remarks,
            createdById: (req as any).user?.id || 'system'
          }
        });
      });

      successCount++;
    } catch (err: any) {
      errors.push(`Failed to process ${entry.partNumber}: ${err.message}`);
    }
  }

  res.status(200).json({
    success: true,
    message: `Processed ${successCount} ledger entries`,
    errors: errors.length > 0 ? errors : undefined
  });
});

export const getLedgerSummary = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, groupBy = 'daily' } = req.query;

  const start = startDate ? new Date(String(startDate)) : new Date('2026-01-01');
  const end = endDate ? new Date(String(endDate)) : new Date();
  end.setHours(23, 59, 59, 999);

  const entries = await prisma.dailyLedger.findMany({
    where: {
      date: { gte: start, lte: end }
    },
    orderBy: { date: 'asc' }
  });

  const groups: Record<string, {
    period: string;
    totalIncoming: number;
    totalOutgoing: number;
    netMovement: number;
    transactionCount: number;
  }> = {};

  for (const entry of entries) {
    let key = '';
    const dateObj = new Date(entry.date);
    if (groupBy === 'monthly') {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      key = `${year}-${month}`;
    } else {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      key = `${year}-${month}-${day}`;
    }

    if (!groups[key]) {
      groups[key] = {
        period: key,
        totalIncoming: 0,
        totalOutgoing: 0,
        netMovement: 0,
        transactionCount: 0
      };
    }

    groups[key].transactionCount++;
    groups[key].netMovement += entry.quantity;
    if (entry.quantity > 0) {
      groups[key].totalIncoming += entry.quantity;
    } else if (entry.quantity < 0) {
      groups[key].totalOutgoing += Math.abs(entry.quantity);
    }
  }

  const result = Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));

  res.status(200).json({ success: true, data: result });
});

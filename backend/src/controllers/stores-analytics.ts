import { Request, Response } from 'express';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';

export const getOverviewStats = asyncHandler(async (req: Request, res: Response) => {
  const allMaterials = await prisma.storesMaterial.findMany({
    select: { closingStock: true, unitRate: true, reorderLevel: true, minimumStock: true }
  });

  const totalMaterials = allMaterials.length;
  const outOfStockItems = allMaterials.filter(m => (m.closingStock || 0) <= 0).length;
  const lowStockItems = allMaterials.filter(m => {
    const stock = m.closingStock || 0;
    const reorder = m.reorderLevel || 0;
    const min = m.minimumStock || 0;
    return stock > 0 && stock <= reorder && stock > min;
  }).length;

  const totalValue = allMaterials.reduce((acc, curr) => {
    return acc + ((curr.closingStock || 0) * (curr.unitRate || 0));
  }, 0);

  res.status(200).json({
    success: true,
    data: {
      total: totalMaterials,
      lowStock: lowStockItems,
      outOfStock: outOfStockItems,
      totalValue
    }
  });
});

export const getStockByCategory = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      materials: {
        select: { closingStock: true, unitRate: true }
      }
    }
  });

  const data = categories.map(cat => ({
    name: cat.name,
    value: cat.materials.reduce((acc, curr) => acc + (curr.closingStock * (curr.unitRate || 0)), 0),
    count: cat.materials.length,
    color: cat.color
  }));

  res.status(200).json({ success: true, data });
});

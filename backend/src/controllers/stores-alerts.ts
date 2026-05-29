import { Request, Response } from 'express';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.status(200).json({ success: true, data: alerts });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.alert.update({
    where: { id: String(id) },
    data: { isRead: true, readAt: new Date() }
  });
  res.status(200).json({ success: true });
});

// background cron logic placeholder
export const checkInventoryAlerts = async () => {
  const materials = await prisma.storesMaterial.findMany();
  
  for (const mat of materials) {
    if (mat.closingStock <= (mat.minimumStock || 0)) {
      await prisma.alert.create({
        data: {
          type: 'CRITICAL_STOCK',
          severity: 'CRITICAL',
          title: `CRITICAL STOCK: ${mat.partNumber}`,
          message: `${mat.productName} has reached critical level (${mat.closingStock} ${mat.unit || 'pcs'}).`,
          referenceId: mat.id,
          refType: 'MATERIAL',
          actionUrl: '/dashboard/stores/inventory'
        }
      });
    } else if (mat.closingStock <= (mat.reorderLevel || 0)) {
       // Only create if not already alerted recently
       await prisma.alert.create({
        data: {
          type: 'LOW_STOCK',
          severity: 'HIGH',
          title: `Low Stock: ${mat.partNumber}`,
          message: `${mat.productName} is below reorder level. Current: ${mat.closingStock}`,
          referenceId: mat.id,
          refType: 'MATERIAL'
        }
      });
    }
  }
};

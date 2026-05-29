import { Request, Response } from 'express';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';

// --- Vendor Controllers ---

export const getVendors = asyncHandler(async (req: Request, res: Response) => {
  const { search, isActive } = req.query;
  const where: any = {};
  if (search) {
    where.OR = [
      { vendorName: { contains: String(search) } },
      { gstNumber: { contains: String(search) } },
    ];
  }
  if (isActive) where.isActive = isActive === 'true';

  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      _count: { select: { purchaseOrders: true } }
    },
    orderBy: { vendorName: 'asc' }
  });

  res.status(200).json({ success: true, data: vendors });
});

export const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await prisma.vendor.create({
    data: req.body
  });
  res.status(201).json({ success: true, data: vendor });
});

// --- PurchaseOrder Controllers ---

export const getPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      vendor: true,
      _count: { select: { items: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ success: true, data: pos });
});

export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId, items, ...header } = req.body;

  // Auto-generate PO number: TC_YYYYMM_NNN
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const datePrefix = `TC_${year}${month}`;
  
  const lastPo = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: datePrefix } },
    orderBy: { poNumber: 'desc' }
  });

  let sequence = 1;
  if (lastPo) {
    const lastSeq = parseInt(lastPo.poNumber.split('_')[2]);
    sequence = lastSeq + 1;
  }
  const poNumber = `${datePrefix}_${sequence.toString().padStart(3, '0')}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      ...header,
      poNumber,
      vendorId,
      createdById: (req as any).user?.id || 'system',
      items: {
        create: items.map((item: any) => ({
          materialId: item.materialId,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          amount: item.qty * item.rate
        }))
      }
    },
    include: { items: true, vendor: true }
  });

  res.status(201).json({ success: true, data: po });
});

export const receivePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items, notes } = req.body; // Array of { poItemId, qtyReceived }

  const po = (await prisma.purchaseOrder.findUnique({
    where: { id: String(id) },
    include: { items: true }
  })) as any;

  if (!po) throw new AppError('PO not found', 404);

  const receipt = await prisma.poReceipt.create({
    data: {
      poId: String(id),
      receivedById: (req as any).user?.id || 'system',
      notes,
      items: {
        create: items.map((item: any) => ({
          poItemId: item.poItemId,
          qtyReceived: item.qtyReceived
        }))
      }
    }
  });

  // Update Inventory and PO Item status
  for (const item of items) {
    const poItem = po.items.find((i: any) => i.id === item.poItemId);
    if (!poItem || !poItem.materialId) continue;

    const qtyReceived = parseFloat(item.qtyReceived);
    
    // Update StoresMaterial
    const material = await prisma.storesMaterial.findUnique({ where: { id: poItem.materialId } });
    if (material) {
      const newClosingStock = material.closingStock + qtyReceived;
      await prisma.storesMaterial.update({
        where: { id: material.id },
        data: {
          closingStock: newClosingStock,
          lastMovementAt: new Date(),
          lastMovementType: 'IN'
        }
      });

      // Ledger entry
      await prisma.dailyLedger.create({
        data: {
          materialId: material.id,
          date: new Date(),
          movementType: 'IN',
          quantity: qtyReceived,
          referenceType: 'PO_RECEIPT',
          referenceId: po.id,
          referenceCode: po.poNumber,
          runningBalance: newClosingStock,
          createdById: (req as any).user?.id || 'system'
        }
      });
    }

    // Update PO Item
    await prisma.purchaseOrderItem.update({
      where: { id: poItem.id },
      data: {
        qtyReceived: poItem.qtyReceived + qtyReceived
      }
    });
  }

  // Check if PO is fully received
  const updatedPo = (await prisma.purchaseOrder.findUnique({
    where: { id: String(id) },
    include: { items: true }
  })) as any;

  const allReceived = updatedPo?.items.every((i: any) => i.qtyReceived >= i.qty);
  await prisma.purchaseOrder.update({
    where: { id: String(id) },
    data: { status: allReceived ? 'COMPLETED' : 'RECEIVED' }
  });

  res.status(200).json({ success: true, message: 'PO receipt processed' });
});

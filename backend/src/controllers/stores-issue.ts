import { Request, Response } from 'express';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';

export const createIssueRequest = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, bomId, notes } = req.body;

  const bom = await prisma.bom.findUnique({
    where: { id: bomId },
    include: { lineItems: true }
  });

  if (!bom) throw new AppError('BOM not found', 404);

  const request = await prisma.issueRequest.create({
    data: {
      projectId,
      bomId,
      requestedById: (req as any).user?.id || 'production-user',
      notes,
      issueItems: {
        create: bom.lineItems.map(item => ({
          materialId: 'placeholder', // We need to match partCode to StoresMaterial id
          partCode: item.partCode,
          componentName: item.itemsComponents,
          qtyRequired: item.qtyReqd,
        }))
      }
    },
    include: { issueItems: true }
  });

  // Try to match material IDs automatically by partCode
  for (const item of request.issueItems) {
    const storeMat = await prisma.storesMaterial.findUnique({
      where: { partNumber: item.partCode }
    });
    if (storeMat) {
      await prisma.issueItem.update({
        where: { id: item.id },
        data: { materialId: storeMat.id }
      });
    }
  }

  res.status(201).json({ success: true, data: request });
});

export const getIssueRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.issueRequest.findMany({
    include: {
      issueItems: true,
      // Add more relations if needed (Project, BOM)
    },
    orderBy: { requestedAt: 'desc' }
  });

  res.status(200).json({ success: true, data: requests });
});

export const processIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items, notes } = req.body; // Array of { issueItemId, qtyToIssue }

  const request = (await prisma.issueRequest.findUnique({
    where: { id: String(id) },
    include: { issueItems: true }
  })) as any;

  if (!request) throw new AppError('Issue request not found', 404);

  let allFullyIssued = true;

  for (const input of items) {
    const issueItem = request.issueItems.find((i: any) => i.id === input.issueItemId);
    if (!issueItem || !issueItem.materialId) continue;

    const qtyToIssue = parseFloat(input.qtyToIssue);
    const material = await prisma.storesMaterial.findUnique({ where: { id: issueItem.materialId } });
    
    if (!material || (material.closingStock - material.reservedStock) < qtyToIssue) {
      throw new AppError(`Insufficient stock for ${issueItem.partCode}`, 400);
    }

    // Update Inventory
    const newClosingStock = material.closingStock - qtyToIssue;
    await prisma.storesMaterial.update({
      where: { id: material.id },
      data: {
        closingStock: newClosingStock,
        lastMovementAt: new Date(),
        lastMovementType: 'OUT'
      }
    });

    // Update Issue Item
    const totalIssued = issueItem.qtyIssued + qtyToIssue;
    const remaining = issueItem.qtyRequired - totalIssued;
    
    await prisma.issueItem.update({
      where: { id: issueItem.id },
      data: {
        qtyIssued: totalIssued,
        qtyPending: remaining,
        isFullyIssued: remaining <= 0
      }
    });

    if (remaining > 0) {
      allFullyIssued = false;
      // Create or Update PendingIssue
      await prisma.pendingIssue.upsert({
        where: { id: 'todo-unique-constraint' }, // Need better logic for unique pending issues
        update: { qtyPending: remaining },
        create: {
          issueRequestId: request.id,
          materialId: material.id,
          qtyPending: remaining,
          status: 'WAITING'
        }
      });
    }

    // Ledger entry
    await prisma.dailyLedger.create({
      data: {
        materialId: material.id,
        date: new Date(),
        movementType: 'OUT',
        quantity: -qtyToIssue,
        referenceType: 'BOM_ISSUE',
        referenceId: request.id,
        referenceCode: request.id.slice(0, 8),
        runningBalance: newClosingStock,
        createdById: (req as any).user?.id || 'system'
      }
    });
  }

  // Update Request Status
  await prisma.issueRequest.update({
    where: { id: String(id) },
    data: {
      status: allFullyIssued ? 'COMPLETE' : 'PARTIAL',
      issuedAt: new Date(),
      issuedById: (req as any).user?.id || 'system'
    }
  });

  res.status(200).json({ success: true, message: 'Materials issued' });
});

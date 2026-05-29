import { Request, Response } from 'express';
import prisma from '../services/prisma';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/error';

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, page = '1', limit = '10' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { projectName: { contains: String(search) } },
      { customerName: { contains: String(search) } },
    ];
  }
  if (status) {
    where.status = String(status);
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        _count: { select: { projectBoms: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: projects,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.create({
    data: {
      ...req.body,
      createdById: (req as any).user?.id || 'system',
    },
  });

  res.status(201).json({
    success: true,
    data: project,
  });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await prisma.project.findUnique({
    where: { id: String(id) },
    include: {
      projectBoms: {
        include: { bom: true },
      },
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json({
    success: true,
    data: project,
  });
});

export const linkBomToProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bomId } = req.body;

  const existing = await prisma.projectBom.findUnique({
    where: {
      projectId_bomId: {
        projectId: String(id),
        bomId: String(bomId),
      }
    },
    include: { bom: true }
  });

  if (existing) {
    res.status(200).json({
      success: true,
      data: existing,
    });
    return;
  }

  const projectBom = await prisma.projectBom.create({
    data: {
      projectId: String(id),
      bomId: String(bomId),
      linkedById: (req as any).user?.id || 'system',
    },
    include: { bom: true },
  });

  res.status(201).json({
    success: true,
    data: projectBom,
  });
});

export const unlinkBomFromProject = asyncHandler(async (req: Request, res: Response) => {
  const { id, bomId } = req.params;

  await prisma.projectBom.delete({
    where: {
      projectId_bomId: {
        projectId: String(id),
        bomId: String(bomId),
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'BOM unlinked from project successfully',
  });
});

export const getProductionOverviewStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    totalBoms,
    activeBoms,
    draftBoms,
    totalGenerations,
    recentProjects,
    recentGenerations
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.project.count({ where: { status: 'ON_HOLD' } }),
    prisma.bom.count(),
    prisma.bom.count({ where: { status: 'ACTIVE' } }),
    prisma.bom.count({ where: { status: 'DRAFT' } }),
    prisma.generationRecord.count(),
    prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { projectBoms: true } }
      }
    }),
    prisma.generationRecord.findMany({
      take: 5,
      orderBy: { generatedAt: 'desc' },
      include: {
        project: { select: { projectName: true, projectCode: true } },
        bom: { select: { bomName: true, documentRef: true } }
      }
    })
  ]);

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          onHold: onHoldProjects
        },
        boms: {
          total: totalBoms,
          active: activeBoms,
          draft: draftBoms
        },
        generations: {
          total: totalGenerations
        }
      },
      recentProjects,
      recentGenerations
    }
  });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await prisma.project.update({
    where: { id: String(id) },
    data: req.body,
  });

  res.status(200).json({
    success: true,
    data: project,
  });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.$transaction(async (tx) => {
    // Delete linked projectBoms
    await tx.projectBom.deleteMany({
      where: { projectId: String(id) }
    });
    // Delete projectAssignees
    await tx.projectAssignee.deleteMany({
      where: { projectId: String(id) }
    });
    // Delete generation records
    await tx.generationRecord.deleteMany({
      where: { projectId: String(id) }
    });
    // Delete standard project
    await tx.project.delete({
      where: { id: String(id) },
    });
  });

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
});

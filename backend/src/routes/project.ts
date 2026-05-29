import { Router } from 'express';
import * as projectController from '../controllers/project';

const router = Router();

router.get('/', projectController.getProjects);
router.get('/analytics/overview', projectController.getProductionOverviewStats);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.post('/:id/boms', projectController.linkBomToProject);
router.delete('/:id/boms/:bomId', projectController.unlinkBomFromProject);
router.patch('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;

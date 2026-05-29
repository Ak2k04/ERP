import { Router } from 'express';
import * as generationController from '../controllers/generation';

const router = Router();

router.post('/', generationController.generateBomPdf);
router.post('/excel', generationController.generateBomExcel);

export default router;

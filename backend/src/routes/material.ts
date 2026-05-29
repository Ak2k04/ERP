import { Router } from 'express';
import multer from 'multer';
import * as materialController from '../controllers/material';
import { validate } from '../middleware/validate';
import * as schemas from '../utils/schemas';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.') as any, false);
    }
  }
});

router.get('/', materialController.getMaterials);
router.get('/locations', materialController.getDistinctStorageLocations);
router.get('/categories', materialController.getCategories);
router.post('/', materialController.createMaterial);
router.patch('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);
router.post('/import-excel', upload.single('file'), materialController.importExcel);

export default router;

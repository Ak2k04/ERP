import { Router } from 'express';
import multer from 'multer';
import * as bomController from '../controllers/bom';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.') as any, false);
    }
  }
});

router.get('/', bomController.getBoms);
router.get('/:id', bomController.getBomById);
router.post('/', bomController.createBom);
router.patch('/:id', bomController.updateBom);
router.delete('/:id', bomController.deleteBom);
router.post('/upload', upload.single('file'), bomController.uploadAndExtractBom);

export default router;

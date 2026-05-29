import { Router } from 'express';
import multer from 'multer';
import * as storesController from '../controllers/stores-material';
import * as storesAnalytics from '../controllers/stores-analytics';
import * as storesIssue from '../controllers/stores-issue';
import * as storesProcurement from '../controllers/stores-procurement';
import * as storesLedger from '../controllers/stores-ledger';
import * as storesAlerts from '../controllers/stores-alerts';

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

// --- Analytics ---
router.get('/analytics/overview', storesAnalytics.getOverviewStats);
router.get('/analytics/category-health', storesAnalytics.getStockByCategory);

// --- Categories ---
router.get('/categories', storesController.getCategories);
router.post('/categories', storesController.createCategory);
router.patch('/categories/:id', storesController.updateCategory);
router.delete('/categories/:id', storesController.deleteCategory);

// --- Materials ---
router.get('/materials', storesController.getMaterials);
router.post('/materials', storesController.createMaterial);
router.post('/materials/import', upload.single('file'), storesController.importStoresExcel);
router.post('/materials/adjust', storesController.adjustStock);

// --- Issue Requests ---
router.get('/issue-requests', storesIssue.getIssueRequests);
router.post('/issue-requests', storesIssue.createIssueRequest);
router.post('/issue-requests/:id/issue', storesIssue.processIssue);

// --- Vendors ---
router.get('/vendors', storesProcurement.getVendors);
router.post('/vendors', storesProcurement.createVendor);

// --- Purchase Orders ---
router.get('/purchase-orders', storesProcurement.getPurchaseOrders);
router.post('/purchase-orders', storesProcurement.createPurchaseOrder);
router.post('/purchase-orders/:id/receive', storesProcurement.receivePurchaseOrder);

// --- Daily Ledger ---
router.get('/ledger/summary', storesLedger.getLedgerSummary);
router.get('/ledger', storesLedger.getLedgerEntries);
router.post('/ledger/import', upload.single('file'), storesLedger.importLedgerExcel);

// --- Alerts ---
router.get('/alerts', storesAlerts.getAlerts);
router.patch('/alerts/:id/read', storesAlerts.markAsRead);

export default router;

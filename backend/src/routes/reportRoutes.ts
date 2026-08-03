import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/analytics', reportController.getAnalytics);
router.get('/export/csv', reportController.exportCsv);
router.get('/export/excel', reportController.exportExcel);
router.get('/export/pdf', reportController.exportPdf);

export default router;

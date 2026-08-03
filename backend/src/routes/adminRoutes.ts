import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../validators/adminValidators';

const router = Router();

// All routes require admin role
router.use(authenticate, authorize('admin'));

// Employee listing
router.get('/pending-employees', adminController.getPendingEmployees);
router.get('/employees', adminController.getEmployees);

// Employee management (support both POST and PATCH)
router.post('/employees/:id/approve', adminController.approveEmployee);
router.patch('/employees/:id/approve', adminController.approveEmployee);

router.post('/employees/:id/reject', adminController.rejectEmployee);
router.patch('/employees/:id/reject', adminController.rejectEmployee);

router.post('/employees/:id/deactivate', adminController.deactivateEmployee);
router.patch('/employees/:id/deactivate', adminController.deactivateEmployee);

// Office settings
router.get('/settings', adminController.getSettings);
router.put('/settings', validate(updateSettingsSchema), adminController.updateSettings);

export default router;

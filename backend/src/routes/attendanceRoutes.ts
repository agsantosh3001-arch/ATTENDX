import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { authenticate } from '../middleware/authenticate';
import { authorize, requireApprovedStatus } from '../middleware/authorize';
import { validate, validateQuery } from '../middleware/validate';
import {
  checkInSchema,
  checkOutSchema,
  lateReasonSchema,
  historyQuerySchema,
  statsQuerySchema,
} from '../validators/attendanceValidators';

const router = Router();

router.use(authenticate);

// Check-in (employees only, approved required)
router.post(
  '/check-in',
  authorize('employee'),
  requireApprovedStatus,
  validate(checkInSchema),
  attendanceController.checkIn
);

// Check-out (employees only, approved required)
router.post(
  '/check-out',
  authorize('employee'),
  requireApprovedStatus,
  validate(checkOutSchema),
  attendanceController.checkOut
);

// Late reason submission (employees only, approved required)
router.post(
  '/late-reason',
  authorize('employee'),
  requireApprovedStatus,
  validate(lateReasonSchema),
  attendanceController.submitLateReason
);

// Today's attendance status (all authenticated users)
router.get('/today', attendanceController.getToday);

// Attendance history with pagination & filtering
router.get('/history', validateQuery(historyQuerySchema), attendanceController.getHistory);

// Monthly attendance stats
router.get('/stats', validateQuery(statsQuerySchema), attendanceController.getStats);

export default router;

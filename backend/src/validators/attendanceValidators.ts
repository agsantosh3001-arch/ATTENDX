import { z } from 'zod';

export const checkInSchema = z.object({
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  accuracy: z.number().positive('Accuracy must be positive').max(10000, 'Invalid accuracy'),
  lateReason: z.string().trim().optional(),
});

export const checkOutSchema = z.object({
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  accuracy: z.number().positive('Accuracy must be positive').max(10000, 'Invalid accuracy'),
});

export const lateReasonSchema = z.object({
  attendanceId: z.string().uuid('Invalid attendance ID'),
  lateReason: z.string().trim().min(3, 'Late reason must be at least 3 characters'),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional(),
  status: z.enum(['present', 'late', 'absent', 'half_day']).optional(),
  employeeId: z.string().uuid().optional(),
});

export const statsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  employeeId: z.string().uuid().optional(),
});

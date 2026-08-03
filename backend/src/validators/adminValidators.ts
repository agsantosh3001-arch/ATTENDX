import { z } from 'zod';

export const updateSettingsSchema = z.object({
  officeLatitude: z.number().min(-90).max(90).optional(),
  officeLongitude: z.number().min(-180).max(180).optional(),
  allowedRadiusMeters: z.number().positive('Radius must be positive').optional(),
  gpsAccuracyThresholdMeters: z.number().positive('Accuracy threshold must be positive').optional(),
  officeStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional(),
  officeEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm').optional(),
  timezone: z.string().min(1).optional(),
});

import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const onboardingSchema = z.object({
  fullName: z.string().min(2).optional(),
  department: z.string().min(2, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
  age: z.coerce.number().int('Age must be a valid number').min(18, 'Age must be at least 18 years').max(70, 'Age must be at most 70 years'),
  phoneNumber: z.string().min(7, 'Phone number must be at least 7 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

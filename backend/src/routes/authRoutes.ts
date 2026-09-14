import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import crypto from 'crypto';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { adminLoginSchema, onboardingSchema } from '../validators/authValidators';
import * as authService from '../services/authService';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';

const router = Router();

// Admin Email/Password Login
router.post(
  '/admin/login',
  authRateLimiter,
  validate(adminLoginSchema),
  authController.adminLogin
);

// Helper to extract client origin dynamically from request headers or auth cookie
const getClientOrigin = (req: Request): string => {
  if (req.cookies?.client_origin) {
    return req.cookies.client_origin;
  }

  const referer = req.headers.referer || req.headers.origin;
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      // ignore
    }
  }

  const host = req.headers.host;
  if (host) {
    const protocol = req.protocol || 'http';
    return `${protocol}://${host}`;
  }

  return config.frontendUrl;
};

// Check Device Status (No Directory Leakage)
router.get('/device-status', authController.getDeviceStatus);

// Google OAuth Trigger
router.get('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referer = req.headers.referer || req.headers.origin;
    let clientOrigin = config.frontendUrl;
    if (referer) {
      try {
        clientOrigin = new URL(referer).origin;
      } catch {
        // ignore
      }
    } else if (req.headers.host) {
      clientOrigin = `${req.protocol || 'http'}://${req.headers.host}`;
    }

    res.cookie('client_origin', clientOrigin, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    });

    if (config.googleClientId === 'mock_google_client_id') {
      // Check if current browser already has a registered device bound to an employee
      const deviceId = req.cookies?.attendx_device_id || (req.headers['x-device-id'] as string);
      const status = await authService.getDeviceStatus(deviceId);

      if (status.isRegistered && status.user) {
        // Automatically authenticate the bound employee securely
        return res.redirect(`${clientOrigin}/api/auth/google/dev-select`);
      }

      // If unregistered device, redirect to login with single-account onboarding prompt
      return res.redirect(`${clientOrigin}/login?mode=register`);
    }

    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Secure Dev Google Authentication Handler (Enforces Device Binding)
router.get('/google/dev-select', async (req: Request, res: Response, next: NextFunction) => {
  const clientOrigin = getClientOrigin(req);
  try {
    if (config.nodeEnv === 'production' && config.googleClientId !== 'mock_google_client_id') {
      return next(new AppError('FORBIDDEN', 403, 'Mock account picker is disabled in production with real OAuth.'));
    }

    const deviceId = req.cookies?.attendx_device_id || (req.headers['x-device-id'] as string);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // If device is already registered, find bound user directly
    let targetEmail = (req.query.email as string) || '';
    let targetName = (req.query.name as string) || '';

    if (deviceId && !targetEmail) {
      const boundDevice = await authService.getDeviceStatus(deviceId);
      if (boundDevice.isRegistered && boundDevice.user) {
        // Bound account discovered securely through device cookie
        const fullDevice = await prisma.registeredDevice.findUnique({
          where: { deviceRegistrationId: deviceId },
          include: { employee: true },
        });
        if (fullDevice?.employee) {
          targetEmail = fullDevice.employee.email;
          targetName = fullDevice.employee.fullName || 'Employee';
        }
      }
    }

    // Default fallback for first-time developer registration if no email provided
    if (!targetEmail) {
      targetEmail = 'vivaninteriors@gmail.com';
      targetName = 'VIVAN';
    }

    const googleId = `google_mock_${crypto.createHash('md5').update(targetEmail.toLowerCase()).digest('hex').substring(0, 10)}`;

    const mockProfile = {
      googleId,
      email: targetEmail.toLowerCase(),
      fullName: targetName || 'Employee',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetName || targetEmail)}`,
    };

    const user = await authService.processGoogleAuthUser(mockProfile);

    // Validate or Register Device Binding
    const sessionResult = await authService.completeEmployeeSession(user.id, deviceId, ipAddress, userAgent);

    // Set persistent Device ID Cookie (1 Year)
    res.cookie('attendx_device_id', sessionResult.deviceRegistrationId, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    // Set Refresh Token Cookie (14 Days)
    res.cookie('refreshToken', sessionResult.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    if (!user.department || !user.designation) {
      return res.redirect(`${clientOrigin}/onboarding?token=${sessionResult.accessToken}`);
    }

    if (user.status === 'pending') {
      return res.redirect(`${clientOrigin}/pending-approval?token=${sessionResult.accessToken}`);
    }

    if (user.status === 'rejected') {
      return res.redirect(`${clientOrigin}/rejected`);
    }

    if (user.status === 'deactivated') {
      return res.redirect(`${clientOrigin}/deactivated`);
    }

    res.redirect(`${clientOrigin}/dashboard?token=${sessionResult.accessToken}`);
  } catch (error: any) {
    if (error.statusCode === 403) {
      const errCode = error.code === 'DEVICE_REVOKED' ? 'device_revoked' : 'device_mismatch';
      return res.redirect(`${clientOrigin}/login?error=${errCode}`);
    }
    next(error);
  }
});

// Google OAuth Callback
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    const clientOrigin = getClientOrigin(req);

    passport.authenticate('google', { session: false }, async (err, user) => {
      if (err || !user) {
        return res.redirect(`${clientOrigin}/login?error=google_auth_failed`);
      }

      try {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const deviceId = req.cookies?.attendx_device_id || (req.headers['x-device-id'] as string);

        const sessionResult = await authService.completeEmployeeSession(user.id, deviceId, ipAddress, userAgent);

        // Set Device Cookie
        res.cookie('attendx_device_id', sessionResult.deviceRegistrationId, {
          httpOnly: true,
          secure: config.nodeEnv === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        // Set Refresh Token Cookie
        res.cookie('refreshToken', sessionResult.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        // Route user based on profile state and approval status
        if (!user.department || !user.designation) {
          return res.redirect(`${clientOrigin}/onboarding?token=${sessionResult.accessToken}`);
        }

        if (user.status === 'pending') {
          return res.redirect(`${clientOrigin}/pending-approval?token=${sessionResult.accessToken}`);
        }

        if (user.status === 'rejected') {
          return res.redirect(`${clientOrigin}/rejected`);
        }

        if (user.status === 'deactivated') {
          return res.redirect(`${clientOrigin}/deactivated`);
        }

        res.redirect(`${clientOrigin}/dashboard?token=${sessionResult.accessToken}`);
      } catch (error: any) {
        if (error.statusCode === 403) {
          const errCode = error.code === 'DEVICE_REVOKED' ? 'device_revoked' : 'device_mismatch';
          return res.redirect(`${clientOrigin}/login?error=${errCode}`);
        }
        next(error);
      }
    })(req, res, next);
  }
);

// Employee Onboarding (supports /onboard and /onboarding)
router.post(
  '/onboard',
  authenticate,
  validate(onboardingSchema),
  authController.completeOnboarding
);

router.post(
  '/onboarding',
  authenticate,
  validate(onboardingSchema),
  authController.completeOnboarding
);

// Refresh Token
router.post(
  '/refresh',
  authController.refresh
);

// Logout
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// Get Current User Profile
router.get(
  '/me',
  authenticate,
  authController.getMe
);

export default router;

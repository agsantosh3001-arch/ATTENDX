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

// Google OAuth Trigger
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
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
    secure: false,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  if (config.googleClientId === 'mock_google_client_id') {
    return res.redirect(`${clientOrigin}/google-picker`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Development Mock Account Selector Handler
router.get('/google/dev-select', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = (req.query.email as string) || 'john.doe@attendx.com';
    const fullName = (req.query.name as string) || 'John Doe';
    const googleId = `google_mock_${crypto.createHash('md5').update(email).digest('hex').substring(0, 10)}`;

    const mockProfile = {
      googleId,
      email: email.toLowerCase(),
      fullName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
    };

    const user = await authService.processGoogleAuthUser(mockProfile);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const sessionResult = await authService.completeEmployeeSession(user.id, ipAddress, userAgent);
    const clientOrigin = getClientOrigin(req);

    res.cookie('refreshToken', sessionResult.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    });

    if (!user.department || !user.designation) {
      return res.redirect(`${clientOrigin}/onboarding?token=${sessionResult.accessToken}`);
    }

    if (user.status === 'pending') {
      return res.redirect(`${clientOrigin}/pending-approval?token=${sessionResult.accessToken}`);
    }

    res.redirect(`${clientOrigin}/dashboard?token=${sessionResult.accessToken}`);
  } catch (error) {
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
        const sessionResult = await authService.completeEmployeeSession(user.id, ipAddress, userAgent);

        res.cookie('refreshToken', sessionResult.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
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
      } catch (error) {
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

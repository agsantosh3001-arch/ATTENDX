import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../utils/appError';
import { logAuditEvent } from './auditService';

export interface AdminLoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface OnboardingInput {
  fullName: string;
  department: string;
  designation: string;
  age: number;
  phoneNumber: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(user: { id: string; role: string; email: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtAccessSecret,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export async function adminLogin(input: AdminLoginInput) {
  const { email, password, ipAddress, userAgent } = input;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || user.role !== 'admin') {
    await logAuditEvent(null, 'user.login_failed', ipAddress, { email, reason: 'Invalid user or not admin' });
    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  }

  // Check account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMs = user.lockedUntil.getTime() - Date.now();
    const remainingMins = Math.ceil(remainingMs / (60 * 1000));
    throw new AppError(
      'ACCOUNT_LOCKED',
      429,
      `Account is locked due to too many failed login attempts. Try again in ${remainingMins} minute(s).`,
      { remainingMinutes: remainingMins }
    );
  }

  if (!user.passwordHash) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    let lockedUntil: Date | null = null;

    if (newFailedAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        lockedUntil,
      },
    });

    await logAuditEvent(user.id, 'user.login_failed', ipAddress, {
      failedAttempts: newFailedAttempts,
      locked: !!lockedUntil,
    });

    if (lockedUntil) {
      throw new AppError(
        'ACCOUNT_LOCKED',
        429,
        'Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.',
        { remainingMinutes: 15 }
      );
    }

    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
  }

  // Password valid -> reset lockout counters
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + config.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000);

  // Enforce 1 active session per user via UPSERT
  await prisma.session.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      refreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
    update: {
      refreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });

  await logAuditEvent(user.id, 'user.login', ipAddress, { role: user.role });

  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    department: user.department,
    designation: user.designation,
    avatarUrl: user.avatarUrl,
  };

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
}

export async function processGoogleAuthUser(profile: {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}) {
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: profile.googleId },
        { email: profile.email.toLowerCase() },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        googleId: profile.googleId,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl || null,
        role: 'employee',
        status: 'pending',
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl || user.avatarUrl,
      },
    });
  }

  return user;
}

export async function completeEmployeeSession(userId: string, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404, 'User not found');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + config.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000);

  await prisma.session.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      refreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
    update: {
      refreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });

  await logAuditEvent(user.id, 'user.login', ipAddress, { method: 'google_oauth' });

  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    department: user.department,
    designation: user.designation,
    avatarUrl: user.avatarUrl,
  };

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
}

export async function completeOnboarding(userId: string, data: OnboardingInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName || user.fullName,
      department: data.department,
      designation: data.designation,
      age: data.age,
      phoneNumber: data.phoneNumber,
      status: 'pending',
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      department: true,
      designation: true,
      age: true,
      phoneNumber: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return updatedUser;
}

export async function refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string) {
  if (!refreshToken) {
    throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Refresh token required');
  }

  const refreshTokenHash = hashToken(refreshToken);

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Invalid or expired refresh token');
  }

  if (session.user.status === 'deactivated') {
    await prisma.session.delete({ where: { id: session.id } });
    throw new AppError('ACCOUNT_DEACTIVATED', 403, 'Account is deactivated');
  }

  const newAccessToken = generateAccessToken(session.user);
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + config.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newRefreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(userId: string, ipAddress?: string) {
  await prisma.session.deleteMany({
    where: { userId },
  });
  await logAuditEvent(userId, 'user.logout', ipAddress);
}

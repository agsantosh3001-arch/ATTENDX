import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  fullName?: string | null;
  department?: string | null;
  designation?: string | null;
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: 'admin' | 'employee';
      status: 'pending' | 'approved' | 'rejected' | 'deactivated';
      fullName?: string | null;
      department?: string | null;
      designation?: string | null;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 401, 'Access token is required');
    }

    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = jwt.verify(token, config.jwtAccessSecret);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('TOKEN_EXPIRED', 401, 'Access token expired');
      }
      throw new AppError('INVALID_TOKEN', 401, 'Invalid access token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        fullName: true,
        department: true,
        designation: true,
      },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 401, 'User account no longer exists');
    }

    if (user.status === 'deactivated') {
      throw new AppError('ACCOUNT_DEACTIVATED', 403, 'Your account has been deactivated');
    }

    req.user = user as Express.User;
    next();
  } catch (error) {
    next(error);
  }
}

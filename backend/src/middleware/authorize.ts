import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export function authorize(...roles: ('admin' | 'employee')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('FORBIDDEN', 403, 'You do not have permission to access this resource')
      );
    }

    next();
  };
}

export function requireApprovedStatus(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError('UNAUTHORIZED', 401, 'Authentication required'));
  }

  if (req.user.role === 'employee' && req.user.status !== 'approved') {
    return next(
      new AppError(
        'PENDING_APPROVAL',
        403,
        `Your account status is ${req.user.status}. Approved account status required.`
      )
    );
  }

  next();
}

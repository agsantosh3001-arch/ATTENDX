import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService';
import { AppError } from '../utils/appError';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const result = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    await notificationService.markAllNotificationsRead(req.user.id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
}

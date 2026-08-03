import { Request, Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendanceService';
import { AppError } from '../utils/appError';

export async function checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const { latitude, longitude, accuracy, lateReason } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await attendanceService.processCheckIn(
      req.user.id,
      { latitude, longitude, accuracy, lateReason },
      ipAddress
    );

    res.status(200).json({
      success: true,
      data: {
        attendance: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const { latitude, longitude, accuracy } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await attendanceService.processCheckOut(
      req.user.id,
      { latitude, longitude, accuracy },
      ipAddress
    );

    res.status(200).json({
      success: true,
      data: {
        attendance: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function submitLateReason(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const { attendanceId, lateReason } = req.body;

    const result = await attendanceService.submitLateReason(req.user.id, attendanceId, lateReason);

    res.status(200).json({
      success: true,
      data: {
        attendance: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');

    const result = await attendanceService.getTodayAttendance(req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');

    const result = await attendanceService.getAttendanceHistory(
      req.user.id,
      req.user.role,
      req.query as any
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');

    const result = await attendanceService.getMonthlyStats(
      req.user.id,
      req.user.role,
      req.query as any
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

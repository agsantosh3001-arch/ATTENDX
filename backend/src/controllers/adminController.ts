import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/adminService';
import { AppError } from '../utils/appError';

export async function approveEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await adminService.approveEmployee(id, req.user.id, ipAddress);

    res.status(200).json({
      success: true,
      data: {
        user: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await adminService.rejectEmployee(id, req.user.id, ipAddress);

    res.status(200).json({
      success: true,
      data: {
        user: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await adminService.deactivateEmployee(id, req.user.id, ipAddress);

    res.status(200).json({
      success: true,
      data: {
        user: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await adminService.getOfficeSettings();

    res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employees = await adminService.getPendingEmployees();
    res.status(200).json({
      success: true,
      data: {
        employees,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employees = await adminService.getEmployees();
    res.status(200).json({
      success: true,
      data: {
        employees,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminService.updateOfficeSettings(req.user.id, req.body, ipAddress);

    res.status(200).json({
      success: true,
      data: {
        settings: updated,
      },
    });
  } catch (error) {
    next(error);
  }
}

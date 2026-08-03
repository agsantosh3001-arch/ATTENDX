import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/reportService';
import { AppError } from '../utils/appError';

export async function getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const department = req.query.department as string | undefined;

    const data = await reportService.getAnalyticsSummary({ month, year, department });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const ipAddress = req.ip || req.socket.remoteAddress;

    const csvData = await reportService.generateCsvReport(req.user.id, { month, year }, ipAddress);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${year}_${month}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
}

export async function exportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const ipAddress = req.ip || req.socket.remoteAddress;

    const excelBuffer = await reportService.generateExcelReport(req.user.id, { month, year }, ipAddress);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${year}_${month}.xlsx`);
    res.status(200).send(excelBuffer);
  } catch (error) {
    next(error);
  }
}

export async function exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const ipAddress = req.ip || req.socket.remoteAddress;

    const pdfBuffer = await reportService.generatePdfReport(req.user.id, { month, year }, ipAddress);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${year}_${month}.pdf`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

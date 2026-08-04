import { prisma } from '../config/database';
import { getOfficeSettings } from './adminService';
import { logAuditEvent } from './auditService';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export interface ReportFilter {
  month: number; // 1 - 12
  year: number;  // e.g. 2026
  department?: string;
}

export async function getAnalyticsSummary(filter: ReportFilter) {
  const officeSettings = await getOfficeSettings();
  const startDate = new Date(filter.year, filter.month - 1, 1);
  const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);

  const whereClause: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filter.department) {
    whereClause.employee = {
      department: filter.department,
    };
  }

  const attendanceRecords = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          designation: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  const totalEmployees = await prisma.user.count({
    where: { role: 'employee', status: 'approved' },
  });

  let presentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let totalWorkingMinutes = 0;

  const departmentMap: Record<string, { present: number; totalHours: number }> = {};
  const dailyTrendMap: Record<string, { date: string; present: number; late: number; absent: number; totalHours: number }> = {};

  for (const record of attendanceRecords) {
    if (record.status === 'present') presentCount++;
    else if (record.status === 'late') lateCount++;
    else if (record.status === 'half_day') halfDayCount++;
    else if (record.status === 'absent') absentCount++;

    if (record.workingMinutes) {
      totalWorkingMinutes += record.workingMinutes;
    }

    const dept = record.employee.department || 'Unassigned';
    if (!departmentMap[dept]) {
      departmentMap[dept] = { present: 0, totalHours: 0 };
    }
    if (record.status === 'present' || record.status === 'late' || record.status === 'half_day') {
      departmentMap[dept].present++;
      departmentMap[dept].totalHours += (record.workingMinutes || 0) / 60;
    }

    const dateStr = format(record.date, 'MMM d');
    if (!dailyTrendMap[dateStr]) {
      dailyTrendMap[dateStr] = { date: dateStr, present: 0, late: 0, absent: 0, totalHours: 0 };
    }
    if (record.status === 'present') dailyTrendMap[dateStr].present++;
    if (record.status === 'late') dailyTrendMap[dateStr].late++;
    if (record.status === 'absent') dailyTrendMap[dateStr].absent++;
    if (record.workingMinutes) {
      dailyTrendMap[dateStr].totalHours += Math.round((record.workingMinutes / 60) * 10) / 10;
    }
  }

  const totalTotalHours = Math.round((totalWorkingMinutes / 60) * 10) / 10;
  const avgHoursPerEmp = totalEmployees > 0 ? Math.round((totalTotalHours / totalEmployees) * 10) / 10 : 0;

  return {
    month: filter.month,
    year: filter.year,
    totalEmployees,
    totalRecords: attendanceRecords.length,
    statusBreakdown: {
      present: presentCount,
      late: lateCount,
      halfDay: halfDayCount,
      absent: absentCount,
    },
    totalWorkingHours: totalTotalHours,
    avgWorkingHoursPerEmployee: avgHoursPerEmp,
    departmentBreakdown: Object.entries(departmentMap).map(([dept, val]) => ({
      department: dept,
      presentCount: val.present,
      totalHours: Math.round(val.totalHours * 10) / 10,
    })),
    dailyTrend: Object.values(dailyTrendMap),
  };
}

export async function generateCsvReport(adminUserId: string, filter: ReportFilter, ipAddress?: string): Promise<string> {
  const startDate = new Date(filter.year, filter.month - 1, 1);
  const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      employee: {
        select: { fullName: true, email: true, department: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  const headers = ['Date', 'Employee Name', 'Email', 'Department', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Late Reason'];
  const rows = records.map((r: any) => [
    format(r.date, 'yyyy-MM-dd'),
    `"${r.employee.fullName || ''}"`,
    `"${r.employee.email}"`,
    `"${r.employee.department || ''}"`,
    r.checkInTime ? format(r.checkInTime, 'HH:mm:ss') : '',
    r.checkOutTime ? format(r.checkOutTime, 'HH:mm:ss') : '',
    r.formattedHours || '',
    r.status,
    `"${(r.lateReason || '').replace(/"/g, '""')}"`,
  ]);

  const csvString = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');

  await logAuditEvent(adminUserId, 'report.generated', ipAddress, { format: 'csv', month: filter.month, year: filter.year });

  return csvString;
}

export async function generateExcelReport(adminUserId: string, filter: ReportFilter, ipAddress?: string): Promise<Buffer> {
  const startDate = new Date(filter.year, filter.month - 1, 1);
  const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      employee: {
        select: { fullName: true, email: true, department: true, designation: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AttendX System';
  const worksheet = workbook.addWorksheet(`Attendance ${filter.month}-${filter.year}`);

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Employee Name', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Department', key: 'dept', width: 18 },
    { header: 'Check In', key: 'checkIn', width: 12 },
    { header: 'Check Out', key: 'checkOut', width: 12 },
    { header: 'Hours', key: 'hours', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Late Reason', key: 'lateReason', width: 30 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E40AF' },
  };

  records.forEach((r: any) => {
    worksheet.addRow({
      date: format(r.date, 'yyyy-MM-dd'),
      name: r.employee.fullName || '—',
      email: r.employee.email,
      dept: r.employee.department || '—',
      checkIn: r.checkInTime ? format(r.checkInTime, 'HH:mm:ss') : '—',
      checkOut: r.checkOutTime ? format(r.checkOutTime, 'HH:mm:ss') : '—',
      hours: r.formattedHours || '—',
      status: r.status.toUpperCase(),
      lateReason: r.lateReason || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  await logAuditEvent(adminUserId, 'report.generated', ipAddress, { format: 'excel', month: filter.month, year: filter.year });

  return Buffer.from(buffer);
}

export async function generatePdfReport(adminUserId: string, filter: ReportFilter, ipAddress?: string): Promise<Buffer> {
  const startDate = new Date(filter.year, filter.month - 1, 1);
  const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      employee: {
        select: { fullName: true, email: true, department: true },
      },
    },
    orderBy: { date: 'asc' },
    take: 100,
  });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        await logAuditEvent(adminUserId, 'report.generated', ipAddress, { format: 'pdf', month: filter.month, year: filter.year });
        resolve(pdfData);
      });

      // PDF Title Header
      doc.fontSize(22).fillColor('#1E40AF').text('AttendX Attendance Summary Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#4B5563').text(`Month: ${filter.month} / Year: ${filter.year}`, { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(14).fillColor('#111827').text('Monthly Attendance Records', { underline: true });
      doc.moveDown(0.5);

      // Table Headers
      doc.fontSize(10).fillColor('#374151');
      doc.text('Date          Name                      Department      Status        Working Hours');
      doc.text('----------------------------------------------------------------------------------');

      records.forEach((r: any) => {
        const d = format(r.date, 'yyyy-MM-dd');
        const name = (r.employee.fullName || r.employee.email).slice(0, 20).padEnd(25, ' ');
        const dept = (r.employee.department || 'N/A').slice(0, 14).padEnd(16, ' ');
        const status = r.status.toUpperCase().padEnd(12, ' ');
        const hours = r.formattedHours || '—';

        doc.text(`${d}   ${name}${dept}${status}${hours}`);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

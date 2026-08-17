import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { validateGpsLocation } from './gpsService';
import { getOfficeSettings } from './adminService';
import { getTodayDate, formatTimeString, formatWorkingHours } from '../utils/dateUtils';
import { logAuditEvent } from './auditService';

export interface CheckInInput {
  latitude: number;
  longitude: number;
  accuracy: number;
  lateReason?: string;
}

export interface CheckOutInput {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export async function processCheckIn(employeeId: string, input: CheckInInput, ipAddress?: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });

  if (!employee || employee.role !== 'employee') {
    throw new AppError('EMPLOYEE_NOT_FOUND', 404, 'Employee not found');
  }

  if (employee.status !== 'approved') {
    throw new AppError('PENDING_APPROVAL', 403, `Account status is ${employee.status}. Approval required for attendance.`);
  }

  const officeSettings = await getOfficeSettings();
  const today = getTodayDate(officeSettings.timezone);

  // Idempotency / Duplicate check
  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: today,
      },
    },
  });

  if (existing && existing.checkInTime) {
    throw new AppError('ALREADY_CHECKED_IN', 400, 'You have already checked in today.');
  }

  // GPS Validation
  validateGpsLocation(input.latitude, input.longitude, input.accuracy, officeSettings);

  // Late Detection
  const now = new Date();
  const currentTimeString = formatTimeString(now, officeSettings.timezone);
  const isLate = currentTimeString > officeSettings.officeStartTime;

  if (isLate && (!input.lateReason || input.lateReason.trim() === '')) {
    throw new AppError(
      'LATE_REASON_REQUIRED',
      400,
      `You are checking in after office start time (${officeSettings.officeStartTime}). A mandatory late reason is required.`,
      { isLate: true, officeStartTime: officeSettings.officeStartTime, checkInTime: currentTimeString }
    );
  }

  const status = isLate ? 'late' : 'present';

  const record = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: today,
      },
    },
    update: {
      checkInTime: now,
      checkInLatitude: input.latitude,
      checkInLongitude: input.longitude,
      checkInAccuracy: input.accuracy,
      status,
      isLate,
      lateReason: isLate ? input.lateReason?.trim() : null,
    },
    create: {
      employeeId,
      date: today,
      checkInTime: now,
      checkInLatitude: input.latitude,
      checkInLongitude: input.longitude,
      checkInAccuracy: input.accuracy,
      status,
      isLate,
      lateReason: isLate ? input.lateReason?.trim() : null,
    },
  });

  await logAuditEvent(employeeId, 'attendance.check_in', ipAddress, {
    attendanceId: record.id,
    isLate,
    status,
  });

  return record;
}

export async function processCheckOut(employeeId: string, input: CheckOutInput, ipAddress?: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });

  if (!employee || employee.role !== 'employee') {
    throw new AppError('EMPLOYEE_NOT_FOUND', 404, 'Employee not found');
  }

  if (employee.status !== 'approved') {
    throw new AppError('PENDING_APPROVAL', 403, 'Approved account required for attendance.');
  }

  const officeSettings = await getOfficeSettings();
  const today = getTodayDate(officeSettings.timezone);

  const record = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: today,
      },
    },
  });

  if (!record || !record.checkInTime) {
    throw new AppError('NOT_CHECKED_IN', 400, 'You must check in before you can check out.');
  }

  if (record.checkOutTime) {
    throw new AppError('ALREADY_CHECKED_OUT', 400, 'You have already checked out today.');
  }

  // GPS Validation
  validateGpsLocation(input.latitude, input.longitude, input.accuracy, officeSettings);

  const now = new Date();
  const workingMinutes = Math.floor((now.getTime() - record.checkInTime.getTime()) / 60000);
  const formattedHours = formatWorkingHours(workingMinutes);

  // Status adjustment: half day if less than 4 hours (240 minutes)
  const status = workingMinutes < 240 ? 'half_day' : record.status;

  const updatedRecord = await prisma.attendance.update({
    where: { id: record.id },
    data: {
      checkOutTime: now,
      checkOutLatitude: input.latitude,
      checkOutLongitude: input.longitude,
      checkOutAccuracy: input.accuracy,
      workingMinutes,
      formattedHours,
      status,
    },
  });

  await logAuditEvent(employeeId, 'attendance.check_out', ipAddress, {
    attendanceId: record.id,
    workingMinutes,
    formattedHours,
  });

  return updatedRecord;
}

export async function submitLateReason(employeeId: string, attendanceId: string, lateReason: string) {
  const record = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!record || record.employeeId !== employeeId) {
    throw new AppError('NOT_FOUND', 404, 'Attendance record not found');
  }

  if (!record.isLate) {
    throw new AppError('NOT_LATE', 400, 'This attendance record is not marked as late');
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      lateReason: lateReason.trim(),
    },
  });

  return updated;
}

export async function getTodayAttendance(employeeId: string) {
  const officeSettings = await getOfficeSettings();
  const today = getTodayDate(officeSettings.timezone);

  const record = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: today,
      },
    },
  });

  let buttonState: 'CAN_CHECK_IN' | 'CAN_CHECK_OUT' | 'CHECKED_OUT' | 'LATE_REASON_REQUIRED' = 'CAN_CHECK_IN';

  if (record) {
    if (record.checkInTime && !record.checkOutTime) {
      if (record.isLate && (!record.lateReason || record.lateReason.trim() === '')) {
        buttonState = 'LATE_REASON_REQUIRED';
      } else {
        buttonState = 'CAN_CHECK_OUT';
      }
    } else if (record.checkOutTime) {
      buttonState = 'CHECKED_OUT';
    }
  }

  return {
    attendance: record,
    buttonState,
    officeSettings: {
      officeLatitude: officeSettings.officeLatitude,
      officeLongitude: officeSettings.officeLongitude,
      allowedRadiusMeters: officeSettings.allowedRadiusMeters,
      gpsAccuracyThresholdMeters: officeSettings.gpsAccuracyThresholdMeters,
      officeStartTime: officeSettings.officeStartTime,
      officeEndTime: officeSettings.officeEndTime,
      timezone: officeSettings.timezone,
    },
  };
}

export async function getAttendanceHistory(
  userId: string,
  userRole: string,
  query: {
    page?: number | string;
    limit?: number | string;
    startDate?: string;
    endDate?: string;
    status?: 'present' | 'late' | 'absent' | 'half_day';
    employeeId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  let targetEmployeeId: string | undefined = undefined;
  if (userRole !== 'admin') {
    targetEmployeeId = userId;
  } else if (query.employeeId && query.employeeId !== 'all') {
    targetEmployeeId = query.employeeId;
  }

  const page = Math.max(1, parseInt(String(query.page || 1), 10));
  const isLimitAll = String(query.limit) === 'all';
  const limit = isLimitAll ? 2000 : Math.max(1, parseInt(String(query.limit || 10), 10));
  const skip = isLimitAll ? 0 : (page - 1) * limit;

  const whereClause: any = {};

  if (targetEmployeeId) {
    whereClause.employeeId = targetEmployeeId;
  }

  if (query.status && query.status.trim()) {
    whereClause.status = query.status.trim();
  }

  if (query.startDate || query.endDate) {
    whereClause.date = {};
    if (query.startDate) whereClause.date.gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.date.lte = end;
    }
  }

  if (query.search && query.search.trim()) {
    const searchTerm = query.search.trim();
    whereClause.OR = [
      { employee: { fullName: { contains: searchTerm, mode: 'insensitive' } } },
      { employee: { email: { contains: searchTerm, mode: 'insensitive' } } },
      { lateReason: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  const [items, total, statusGroups] = await Promise.all([
    prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            designation: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { date: query.sortOrder === 'asc' ? 'asc' : 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where: whereClause }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { _all: true },
      _sum: { workingMinutes: true },
    }),
  ]);

  let presentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let totalWorkingMinutes = 0;

  for (const group of statusGroups) {
    const count = group._count._all || 0;
    const mins = group._sum.workingMinutes || 0;
    totalWorkingMinutes += mins;
    if (group.status === 'present') presentCount = count;
    else if (group.status === 'late') lateCount = count;
    else if (group.status === 'half_day') halfDayCount = count;
    else if (group.status === 'absent') absentCount = count;
  }

  const attendedDays = presentCount + lateCount + halfDayCount;
  const avgWorkingMinutes = attendedDays > 0 ? Math.round(totalWorkingMinutes / attendedDays) : 0;

  return {
    records: items,
    items,
    pagination: {
      totalRecords: total,
      total,
      page,
      limit,
      totalPages: isLimitAll ? 1 : Math.ceil(total / limit) || 1,
    },
    summary: {
      totalRecords: total,
      presentCount,
      lateCount,
      halfDayCount,
      absentCount,
      totalWorkingMinutes,
      totalWorkingHoursFormatted: formatWorkingHours(totalWorkingMinutes),
      avgWorkingMinutes,
      avgWorkingHoursFormatted: formatWorkingHours(avgWorkingMinutes),
    },
  };
}

export async function getMonthlyStats(
  userId: string,
  userRole: string,
  query: { month?: number; year?: number; employeeId?: string }
) {
  const now = new Date();
  const month = query.month || now.getMonth() + 1;
  const year = query.year || now.getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const whereClause: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (userRole !== 'admin') {
    whereClause.employeeId = userId;
  } else if (query.employeeId && query.employeeId !== 'all') {
    whereClause.employeeId = query.employeeId;
  }

  const records = await prisma.attendance.findMany({
    where: whereClause,
    select: {
      status: true,
      workingMinutes: true,
    },
  });

  const presentCount = records.filter((r: any) => r.status === 'present').length;
  const lateCount = records.filter((r: any) => r.status === 'late').length;
  const absentCount = records.filter((r: any) => r.status === 'absent').length;
  const halfDayCount = records.filter((r: any) => r.status === 'half_day').length;

  const totalWorkingMinutes = records.reduce((acc: number, r: any) => acc + (r.workingMinutes || 0), 0);
  const totalAttendedDays = presentCount + lateCount + halfDayCount;
  const avgWorkingMinutes = totalAttendedDays > 0 ? Math.round(totalWorkingMinutes / totalAttendedDays) : 0;
  const avgFormattedHours = formatWorkingHours(avgWorkingMinutes);

  return {
    month,
    year,
    stats: {
      totalDays: records.length,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      halfDay: halfDayCount,
      totalWorkingMinutes,
      avgWorkingMinutes,
      avgFormattedHours,
    },
  };
}

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
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    status?: 'present' | 'late' | 'absent' | 'half_day';
    employeeId?: string;
  }
) {
  const targetEmployeeId = userRole === 'admin' && query.employeeId ? query.employeeId : userId;
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (userRole !== 'admin' || query.employeeId) {
    whereClause.employeeId = targetEmployeeId;
  }

  if (query.status) {
    whereClause.status = query.status;
  }

  if (query.startDate || query.endDate) {
    whereClause.date = {};
    if (query.startDate) whereClause.date.gte = new Date(query.startDate);
    if (query.endDate) whereClause.date.lte = new Date(query.endDate);
  }

  const [items, total] = await Promise.all([
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
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where: whereClause }),
  ]);

  return {
    records: items,
    items,
    pagination: {
      totalRecords: total,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

  if (userRole !== 'admin' || query.employeeId) {
    whereClause.employeeId = query.employeeId || userId;
  }

  const records = await prisma.attendance.findMany({
    where: whereClause,
  });

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const halfDayCount = records.filter((r) => r.status === 'half_day').length;

  const totalWorkingMinutes = records.reduce((acc, r) => acc + (r.workingMinutes || 0), 0);
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

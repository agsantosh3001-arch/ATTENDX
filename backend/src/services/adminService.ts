
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { logAuditEvent } from './auditService';

export async function approveEmployee(employeeId: string, adminUserId: string, ipAddress?: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });

  if (!employee || employee.role !== 'employee') {
    throw new AppError('EMPLOYEE_NOT_FOUND', 404, 'Employee not found');
  }

  const updatedEmployee = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: employeeId },
      data: { status: 'approved' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        department: true,
        designation: true,
        updatedAt: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: employeeId,
        title: 'Account Approved',
        message: 'Your AttendX account registration has been approved by an administrator.',
        type: 'success',
      },
    });

    return updated;
  });

  await logAuditEvent(adminUserId, 'employee.approved', ipAddress, { employeeId });

  return updatedEmployee;
}

export async function rejectEmployee(employeeId: string, adminUserId: string, ipAddress?: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });

  if (!employee || employee.role !== 'employee') {
    throw new AppError('EMPLOYEE_NOT_FOUND', 404, 'Employee not found');
  }

  const updatedEmployee = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: employeeId },
      data: { status: 'rejected' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        department: true,
        designation: true,
        updatedAt: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: employeeId,
        title: 'Account Rejected',
        message: 'Your AttendX account registration was rejected by an administrator.',
        type: 'error',
      },
    });

    return updated;
  });

  await logAuditEvent(adminUserId, 'employee.rejected', ipAddress, { employeeId });

  return updatedEmployee;
}

export async function deactivateEmployee(employeeId: string, adminUserId: string, ipAddress?: string) {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });

  if (!employee || employee.role !== 'employee') {
    throw new AppError('EMPLOYEE_NOT_FOUND', 404, 'Employee not found');
  }

  const updatedEmployee = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: employeeId },
      data: { status: 'deactivated' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        department: true,
        designation: true,
        updatedAt: true,
      },
    });

    await tx.session.deleteMany({ where: { userId: employeeId } });

    return updated;
  });

  await logAuditEvent(adminUserId, 'employee.deactivated', ipAddress, { employeeId });

  return updatedEmployee;
}

export async function getOfficeSettings() {
  let settings = await prisma.officeSettings.findFirst();

  if (!settings) {
    settings = await prisma.officeSettings.create({
      data: {
        officeLatitude: 22.6178,
        officeLongitude: 88.4206,
        allowedRadiusMeters: 2000,
        gpsAccuracyThresholdMeters: 500,
        officeStartTime: '09:00',
        officeEndTime: '18:00',
        timezone: 'Asia/Kolkata',
      },
    });
  }

  return settings;
}

export async function getPendingEmployees() {
  const employees = await prisma.user.findMany({
    where: {
      role: 'employee',
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
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return employees;
}

export async function getEmployees() {
  const employees = await prisma.user.findMany({
    where: {
      role: 'employee',
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
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return employees;
}

export async function updateOfficeSettings(
  adminUserId: string,
  data: {
    officeLatitude?: number;
    officeLongitude?: number;
    allowedRadiusMeters?: number;
    gpsAccuracyThresholdMeters?: number;
    officeStartTime?: string;
    officeEndTime?: string;
    timezone?: string;
  },
  ipAddress?: string
) {
  const currentSettings = await getOfficeSettings();

  const updated = await prisma.officeSettings.update({
    where: { id: currentSettings.id },
    data,
  });

  await logAuditEvent(adminUserId, 'settings.updated', ipAddress, data);

  return updated;
}

export async function getAuditLogs(limit: number = 50) {
  const logs = await prisma.auditLog.findMany({
    take: limit,
    include: {
      user: {
        select: { id: true, email: true, fullName: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return logs;
}

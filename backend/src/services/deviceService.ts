import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { logAuditEvent } from './auditService';

export interface DeviceMetadata {
  platform: string;
  osFamily: string;
  browserFamily: string;
  deviceLabel: string;
  userAgentHash: string;
  userAgentMetadata: string;
}

export function parseDeviceMetadata(userAgentRaw?: string): DeviceMetadata {
  const ua = userAgentRaw || 'Unknown Client';
  const uaHash = crypto.createHash('sha256').update(ua).digest('hex');

  let osFamily = 'Unknown OS';
  let platform = 'Desktop';
  let browserFamily = 'Unknown Browser';

  // Platform & OS detection
  if (/iPhone|iPad|iPod/i.test(ua)) {
    platform = 'Mobile (iOS)';
    osFamily = 'iOS';
  } else if (/Android/i.test(ua)) {
    platform = 'Mobile (Android)';
    osFamily = 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    platform = 'Desktop (macOS)';
    osFamily = 'macOS';
  } else if (/Windows/i.test(ua)) {
    platform = 'Desktop (Windows)';
    osFamily = 'Windows';
  } else if (/Linux/i.test(ua)) {
    platform = 'Desktop (Linux)';
    osFamily = 'Linux';
  }

  // Browser detection
  if (/Edg\//i.test(ua)) {
    browserFamily = 'Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browserFamily = 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browserFamily = 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browserFamily = 'Firefox';
  }

  const deviceLabel = `${osFamily} • ${browserFamily}`;

  return {
    platform,
    osFamily,
    browserFamily,
    deviceLabel,
    userAgentHash: uaHash,
    userAgentMetadata: ua.substring(0, 500),
  };
}

export function maskEmail(email: string): string {
  const [userPart, domainPart] = email.split('@');
  if (!userPart || !domainPart) return email;
  if (userPart.length <= 3) {
    return `${userPart[0]}***@${domainPart}`;
  }
  const visible = userPart.substring(0, 3);
  return `${visible}***@${domainPart}`;
}

export async function validateOrRegisterDevice(
  employeeId: string,
  reqDeviceId?: string,
  userAgentRaw?: string,
  ipAddress?: string
) {
  const meta = parseDeviceMetadata(userAgentRaw);

  if (reqDeviceId) {
    const existingDevice = await prisma.registeredDevice.findUnique({
      where: { deviceRegistrationId: reqDeviceId },
      include: { employee: true },
    });

    if (existingDevice) {
      if (existingDevice.status === 'revoked') {
        await logAuditEvent(employeeId, 'device.blocked', ipAddress, {
          reason: 'DEVICE_REVOKED',
          deviceId: existingDevice.id,
          registrationId: existingDevice.deviceRegistrationId,
          result: 'BLOCKED',
        });
        throw new AppError(
          'DEVICE_REVOKED',
          403,
          'This device registration has been revoked. Please contact your administrator.'
        );
      }

      if (existingDevice.status === 'disabled') {
        await logAuditEvent(employeeId, 'device.blocked', ipAddress, {
          reason: 'DEVICE_DISABLED',
          deviceId: existingDevice.id,
          registrationId: existingDevice.deviceRegistrationId,
          result: 'BLOCKED',
        });
        throw new AppError(
          'DEVICE_DISABLED',
          403,
          'This device is currently disabled. Please contact your administrator.'
        );
      }

      // Check Employee Binding
      if (existingDevice.employeeId !== employeeId) {
        await logAuditEvent(employeeId, 'DEVICE_MISMATCH', ipAddress, {
          attemptingEmployeeId: employeeId,
          boundEmployeeId: existingDevice.employeeId,
          deviceId: existingDevice.id,
          registrationId: existingDevice.deviceRegistrationId,
          result: 'BLOCKED',
        });
        throw new AppError(
          'DEVICE_BOUND_TO_OTHER_ACCOUNT',
          403,
          'This device is already registered to another account. Please contact your administrator if this device needs to be reassigned.'
        );
      }

      // Validated Device! Update telemetry
      const updated = await prisma.registeredDevice.update({
        where: { id: existingDevice.id },
        data: {
          lastSeenAt: new Date(),
          lastLoginAt: new Date(),
          userAgentMetadata: meta.userAgentMetadata,
          userAgentHash: meta.userAgentHash,
          platform: meta.platform,
          browserFamily: meta.browserFamily,
          osFamily: meta.osFamily,
          deviceLabel: meta.deviceLabel,
        },
      });

      await logAuditEvent(employeeId, 'device.authenticated', ipAddress, {
        deviceId: updated.id,
        deviceLabel: updated.deviceLabel,
        result: 'SUCCESS',
      });

      return {
        device: updated,
        deviceRegistrationId: updated.deviceRegistrationId,
        isNew: false,
      };
    }
  }

  // Generate cryptographically secure random device registration identifier
  const newRegistrationId = crypto.randomBytes(32).toString('hex');

  const newDevice = await prisma.registeredDevice.create({
    data: {
      employeeId,
      deviceRegistrationId: newRegistrationId,
      deviceLabel: meta.deviceLabel,
      platform: meta.platform,
      browserFamily: meta.browserFamily,
      osFamily: meta.osFamily,
      userAgentMetadata: meta.userAgentMetadata,
      userAgentHash: meta.userAgentHash,
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  await logAuditEvent(employeeId, 'device.registered', ipAddress, {
    deviceId: newDevice.id,
    deviceLabel: newDevice.deviceLabel,
    result: 'REGISTERED',
  });

  return {
    device: newDevice,
    deviceRegistrationId: newDevice.deviceRegistrationId,
    isNew: true,
  };
}

export async function getDeviceStatus(deviceRegistrationId?: string) {
  if (!deviceRegistrationId) {
    return { isRegistered: false };
  }

  const device = await prisma.registeredDevice.findUnique({
    where: { deviceRegistrationId },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          department: true,
          designation: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!device || device.status !== 'active') {
    return {
      isRegistered: false,
      status: device ? device.status : 'unregistered',
    };
  }

  return {
    isRegistered: true,
    status: device.status,
    deviceLabel: device.deviceLabel,
    user: {
      fullName: device.employee.fullName || 'Employee',
      maskedEmail: maskEmail(device.employee.email),
      avatarUrl: device.employee.avatarUrl,
      department: device.employee.department,
      designation: device.employee.designation,
      status: device.employee.status,
    },
  };
}

export async function listAllDevices() {
  const devices = await prisma.registeredDevice.findMany({
    orderBy: { lastSeenAt: 'desc' },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          department: true,
          designation: true,
          status: true,
        },
      },
    },
  });

  return devices;
}

export async function revokeDevice(deviceId: string, adminUserId: string, reason?: string, ipAddress?: string) {
  const device = await prisma.registeredDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device) {
    throw new AppError('DEVICE_NOT_FOUND', 404, 'Device registration not found');
  }

  const updated = await prisma.registeredDevice.update({
    where: { id: deviceId },
    data: {
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason: reason || 'Revoked by administrator',
    },
  });

  // Invalidate any active session for that employee
  await prisma.session.deleteMany({
    where: { userId: device.employeeId },
  });

  await logAuditEvent(adminUserId, 'device.revoked', ipAddress, {
    deviceId: device.id,
    employeeId: device.employeeId,
    reason: reason || 'Admin revoked',
  });

  return updated;
}

export async function deleteDevice(deviceId: string, adminUserId: string, ipAddress?: string) {
  const device = await prisma.registeredDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device) {
    throw new AppError('DEVICE_NOT_FOUND', 404, 'Device registration not found');
  }

  await prisma.registeredDevice.delete({
    where: { id: deviceId },
  });

  await logAuditEvent(adminUserId, 'device.deleted', ipAddress, {
    deviceId,
    employeeId: device.employeeId,
  });

  return { message: 'Device registration deleted successfully' };
}

export type Role = 'admin' | 'employee';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day';

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  role: Role;
  status: UserStatus;
  department?: string | null;
  designation?: string | null;
  phoneNumber?: string | null;
  age?: number | null;
  avatarUrl?: string | null;
}

export interface OfficeSettings {
  officeLatitude: number;
  officeLongitude: number;
  allowedRadiusMeters: number;
  gpsAccuracyThresholdMeters: number;
  officeStartTime: string;
  officeEndTime: string;
  timezone: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInAccuracy?: number | null;
  checkOutTime?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutAccuracy?: number | null;
  status: AttendanceStatus;
  isLate: boolean;
  lateReason?: string | null;
  workingMinutes?: number | null;
  formattedHours?: string | null;
  employee?: User;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

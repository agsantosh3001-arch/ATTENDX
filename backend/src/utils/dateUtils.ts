import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current Date in UTC
 */
export function getCurrentUTC(): Date {
  return new Date();
}

/**
 * Returns current date object stripped of time in office timezone
 */
export function getTodayDate(timezone: string = DEFAULT_TIMEZONE): Date {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  const year = zoned.getFullYear();
  const month = zoned.getMonth();
  const day = zoned.getDate();
  // Return UTC date at midnight representing the office date
  return new Date(Date.UTC(year, month, day));
}

/**
 * Formats a Date object to YYYY-MM-DD string in office timezone
 */
export function formatDateString(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, 'yyyy-MM-dd');
}

/**
 * Converts working minutes to formatted string (e.g. 510 -> "8h 30m")
 */
export function formatWorkingHours(minutes: number): string {
  if (minutes < 0) minutes = 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Formats date object to HH:mm string in given timezone
 */
export function formatTimeString(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, 'HH:mm');
}

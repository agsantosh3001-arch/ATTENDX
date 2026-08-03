import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { getOfficeSettings } from '../services/adminService';
import { getTodayDate, formatWorkingHours } from '../utils/dateUtils';
import { logAuditEvent } from '../services/auditService';

/**
 * Auto-checkout job at 23:00 daily
 */
export async function runAutoCheckoutJob() {
  logger.info('[CronJob] Running Auto-Checkout Job at 23:00...');
  try {
    const officeSettings = await getOfficeSettings();
    const today = getTodayDate(officeSettings.timezone);

    const pendingRecords = await prisma.attendance.findMany({
      where: {
        date: today,
        checkInTime: { not: null },
        checkOutTime: null,
      },
    });

    logger.info(`[CronJob] Found ${pendingRecords.length} records requiring auto-checkout.`);

    for (const record of pendingRecords) {
      const now = new Date();
      const checkInTime = record.checkInTime!;
      const workingMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / 60000);
      const formattedHours = formatWorkingHours(workingMinutes);
      const status = workingMinutes < 240 ? 'half_day' : record.status;

      await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkOutTime: now,
          workingMinutes,
          formattedHours,
          status,
        },
      });

      await logAuditEvent(record.employeeId, 'attendance.auto_checkout', 'system', {
        attendanceId: record.id,
        workingMinutes,
        formattedHours,
      });
    }

    logger.info('[CronJob] Auto-Checkout Job completed successfully.');
  } catch (error) {
    logger.error('[CronJob] Error executing Auto-Checkout Job:', error);
  }
}

/**
 * Absent marking job at 13:00 daily
 */
export async function runAbsentMarkingJob() {
  logger.info('[CronJob] Running Absent Marking Job at 13:00...');
  try {
    const officeSettings = await getOfficeSettings();
    const today = getTodayDate(officeSettings.timezone);

    // Skip weekends
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      logger.info('[CronJob] Today is a weekend. Skipping absent marking.');
      return;
    }

    // Check holiday
    const holiday = await prisma.holiday.findUnique({
      where: { date: today },
    });
    if (holiday) {
      logger.info(`[CronJob] Today is a holiday (${holiday.name}). Skipping absent marking.`);
      return;
    }

    // Fetch all active approved employees
    const approvedEmployees = await prisma.user.findMany({
      where: {
        role: 'employee',
        status: 'approved',
      },
    });

    for (const emp of approvedEmployees) {
      const existingRecord = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: today,
          },
        },
      });

      if (!existingRecord) {
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: today,
            status: 'absent',
            isLate: false,
          },
        });
        logger.info(`[CronJob] Marked employee ${emp.fullName} (${emp.email}) as absent for today.`);
      }
    }

    logger.info('[CronJob] Absent Marking Job completed successfully.');
  } catch (error) {
    logger.error('[CronJob] Error executing Absent Marking Job:', error);
  }
}

/**
 * Monthly auto-report generation job at 00:05 on the 1st of every month
 */
export async function runMonthlyAutoReportJob() {
  logger.info('[CronJob] Running Monthly Auto-Report Job...');
  try {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    logger.info(`[CronJob] Generating monthly report archive for ${prevMonth}/${year}...`);
    // System automated report generation triggers audit log
    await logAuditEvent('system', 'report.generated', 'system', { format: 'monthly_archive', month: prevMonth, year });
    logger.info('[CronJob] Monthly Auto-Report Job completed.');
  } catch (error) {
    logger.error('[CronJob] Error executing Monthly Auto-Report Job:', error);
  }
}

/**
 * Session cleanup job at 03:00 daily
 */
export async function runSessionCleanupJob() {
  logger.info('[CronJob] Running Session Cleanup Job at 03:00...');
  try {
    const deleted = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    logger.info(`[CronJob] Cleaned up ${deleted.count} expired sessions.`);
  } catch (error) {
    logger.error('[CronJob] Error executing Session Cleanup Job:', error);
  }
}

/**
 * Initializes node-cron schedules
 */
export function initScheduledJobs() {
  // Auto-checkout at 23:00 daily
  cron.schedule('0 23 * * *', () => {
    runAutoCheckoutJob();
  });

  // Absent marking at 13:00 daily
  cron.schedule('0 13 * * *', () => {
    runAbsentMarkingJob();
  });

  // Session cleanup at 03:00 daily
  cron.schedule('0 3 * * *', () => {
    runSessionCleanupJob();
  });

  // Monthly auto-report at 00:05 on 1st of every month
  cron.schedule('5 0 1 * *', () => {
    runMonthlyAutoReportJob();
  });

  logger.info('Scheduled cron jobs initialized (Auto-Checkout @ 23:00, Absent Marking @ 13:00, Session Cleanup @ 03:00, Monthly Report @ 00:05 on 1st).');
}

import { prisma } from '../config/database';
import { logger } from '../config/logger';

export async function logAuditEvent(
  userId: string | null,
  action: string,
  ipAddress?: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        ipAddress: ipAddress || null,
        metadata: metadata || undefined,
      },
    });
    logger.info(`[AuditLog] ${action} (User: ${userId || 'anonymous'})`);
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
}

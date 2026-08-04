import { PrismaClient } from '@prisma/client';
// Prisma instance initialization
import { logger } from './logger';
import { config } from './env';

export const prisma = new PrismaClient();

let embeddedPgInstance: any = null;

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');
  } catch (error) {
    logger.warn('Failed to connect to configured DATABASE_URL, attempting embedded PostgreSQL server start...');
    try {
      // @ts-ignore
      const { default: EmbeddedPostgres } = await import('embedded-postgres');
      embeddedPgInstance = new EmbeddedPostgres({
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'attendx',
        persistent: true,
      });
      try {
        await embeddedPgInstance.initialise();
      } catch (initErr) {
        // Ignore error if database cluster was already initialized
      }
      await embeddedPgInstance.start();
      try {
        await embeddedPgInstance.createDatabase('attendx');
      } catch (dbErr) {
        // Ignore error if database already exists
      }
      logger.info('Embedded PostgreSQL started on port 5432 with database attendx');
      await prisma.$connect();
      logger.info('Connected to embedded PostgreSQL via Prisma');
    } catch (embeddedErr: any) {
      logger.error('Failed to start embedded PostgreSQL:', embeddedErr?.message || embeddedErr);
      throw embeddedErr;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  if (embeddedPgInstance) {
    await embeddedPgInstance.stop();
  }
}

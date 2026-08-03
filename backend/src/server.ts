import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initScheduledJobs } from './jobs/scheduledJobs';

async function startServer() {
  try {
    await connectDatabase();
    initScheduledJobs();

    const server = app.listen(config.port, () => {
      logger.info(`AttendX Backend Server running on port ${config.port} [${config.nodeEnv}]`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down server gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Database disconnected. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

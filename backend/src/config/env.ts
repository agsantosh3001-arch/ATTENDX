import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/attendx?schema=public',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_attendx_2026_jwt_token_12345',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_attendx_2026_jwt_token_67890',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiryDays: 14,
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5005/api/auth/google/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

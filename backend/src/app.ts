import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { config } from './config/env';
import { configurePassport } from './config/passport';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/appError';

import rateLimit from 'express-rate-limit';

const app = express();

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 10000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many failed login attempts. Please try again after 15 minutes.',
    },
  },
});

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// HTTP request logging
app.use(morgan('combined'));

// Body & Cookie parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api/auth/admin/login', authLimiter);
app.use('/api', apiLimiter);

// Passport initialization
configurePassport();
app.use(passport.initialize());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res, next) => {
  next(new AppError('NOT_FOUND', 404, `Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

export default app;

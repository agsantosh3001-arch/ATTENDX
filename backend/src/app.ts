import express from 'express';
import path from 'path';
import fs from 'fs';
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
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps, or same-origin serverless handlers)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        config.frontendUrl,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ].filter(Boolean);

      const isVercelDomain = origin.endsWith('.vercel.app');
      const isAllowed = allowedOrigins.includes(origin) || isVercelDomain;

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
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

// Frontend User-Agent Static Routing Layer
const mobileDistPath = path.join(__dirname, '../../mobile/dist');
const desktopDistPath = path.join(__dirname, '../../frontend/dist');

// Serve compiled static assets with immutable cache headers
app.use('/assets', (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const targetDist = isMobile && fs.existsSync(mobileDistPath) ? mobileDistPath : desktopDistPath;
  express.static(path.join(targetDist, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })(req, res, next);
});

app.use(express.static(mobileDistPath, { index: false }));
app.use(express.static(desktopDistPath, { index: false }));

// Fallback index.html SPA router based on User-Agent header
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
    return next();
  }

  const ua = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  if (isMobile && fs.existsSync(path.join(mobileDistPath, 'index.html'))) {
    return res.sendFile(path.join(mobileDistPath, 'index.html'));
  }

  if (fs.existsSync(path.join(desktopDistPath, 'index.html'))) {
    return res.sendFile(path.join(desktopDistPath, 'index.html'));
  }

  next();
});

// 404 Handler
app.use((req, res, next) => {
  next(new AppError('NOT_FOUND', 404, `Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

export default app;

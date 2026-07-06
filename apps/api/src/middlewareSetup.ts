import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { responseTimeMiddleware } from './modules/platform/audit/writer.js';
import authRoutes from './routes/auth.js';

export function setupMiddleware(app: express.Application): void {
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  // Request parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Response-time tracking
  app.use(responseTimeMiddleware());

  // Logging
  app.use(morgan('dev'));

  // Rate limiting for public endpoints
  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });

  // Public routes
  app.use('/api/auth', publicLimiter, authRoutes);
}

import 'dotenv/config';

// Prevent unhandled rejections from crashing the server in Node 22
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[UnhandledRejection]', reason);
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDB from './config/database';
import { configureCloudinary } from './config/cloudinary';
import errorHandler from './middleware/errorHandler';

import authRoutes from './routes/auth';
import clubRoutes from './routes/clubs';
import memberRoutes from './routes/members';
import projectRoutes from './routes/projects';
import helpRequestRoutes from './routes/helpRequests';
import newsRoutes from './routes/news';
import mapRoutes from './routes/map';
import districtRoutes from './routes/districts';
import multipleDistrictRoutes from './routes/multipleDistricts';
import adminRoutes from './routes/admin';
import eventRoutes from './routes/events';

const app = express();
app.set('trust proxy', 1);

// Connect to DB and configure services
connectDB().catch((err) => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
configureCloudinary();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limiter
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', app: process.env.APP_NAME, env: process.env.NODE_ENV });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/multiple-districts', multipleDistrictRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Leo Moment API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

export default app;

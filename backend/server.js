import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import db from './src/config/db.js';
import { checkMaturityAlerts } from './src/services/maturityService.js';
import errorHandler from './src/middleware/errorHandler.js';

// Route imports
import authRoutes from './src/routes/auth.js';
import institutionRoutes from './src/routes/institutions.js';
import fdrRoutes from './src/routes/fdr.js';
import documentRoutes from './src/routes/documents.js';
import verificationRoutes from './src/routes/verifications.js';
import releaseRequestRoutes from './src/routes/releaseRequests.js';
import notificationRoutes from './src/routes/notifications.js';
import reportRoutes from './src/routes/reports.js';
import auditRoutes from './src/routes/audit.js';
import userRoutes from './src/routes/users.js';
import settingRoutes from './src/routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
app.use(morgan('dev'));

// Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate Limiter for sensitive Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // generous limit for hackathon demo
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const driver = await db.initDb();
    res.json({
      status: 'UP',
      service: 'SecureFDR Backend API',
      version: '1.0.0',
      database: driver.type,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/fdr', fdrRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/release-requests', releaseRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server
async function startServer() {
  try {
    const driver = await db.initDb();
    console.log(`[Server] Database initialized using ${driver.type.toUpperCase()} engine.`);

    // Check maturity alerts once on server startup
    await checkMaturityAlerts();

    // Schedule check every 6 hours
    setInterval(() => {
      checkMaturityAlerts().catch(console.error);
    }, 6 * 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  SecureFDR Backend API Server running on port ${PORT}`);
      console.log(`  URL: http://localhost:${PORT}/api/health`);
      console.log(`  Hackathon Prototype: SIH26265`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();

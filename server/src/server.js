import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDb, databaseMode } from './config/db.js';
import triageRoutes from './routes/triageRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import sosRoutes from './routes/sosRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';
import healthTrackerRoutes from './routes/healthTrackerRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import { configureEmergencySocket } from './sockets/emergencySocket.js';
// ---------------------------------------------------------------------------
// Shared CORS config — used by both app.use() and OPTIONS preflight handler
// so both always return identical Access-Control-Allow-* headers.
// ---------------------------------------------------------------------------
const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-machine origins (localhost / 127.0.0.1 on any port) and
    // server-to-server calls (no Origin header).
    if (
      !origin ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'x-health-owner-key',   // required by /api/health-tracker endpoints
  ],
  exposedHeaders: ['Content-Length'],
  maxAge: 600,              // cache preflight 10 min — reduces OPTIONS traffic
};

const app = express(), http = createServer(app), io = new Server(http, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
});

// Apply CORS before every route — including OPTIONS preflight.
// CRITICAL: both calls must share corsOptions, otherwise the preflight
// response will advertise different headers than the actual response.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.get('/api/health', (_q, r) => r.json({ success: true, data: { status: 'operational', database: databaseMode, demoMode: databaseMode === 'memory' } }));
app.use('/api/triage', triageRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/simplify-report', ocrRoutes);
app.use('/api/health-tracker', healthTrackerRoutes);
app.use('/api/medicines', medicineRoutes);
app.use((_q, r) => r.status(404).json({ success: false, message: 'Route not found' }));
configureEmergencySocket(io);
connectDb().finally(() => {
  const server = http.listen(env.port, () => console.info(`Sanjeevani API running on ${env.port}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const altPort = Number(env.port) + 1;
      console.warn(`Port ${env.port} is busy, retrying on fallback port ${altPort}...`);
      http.listen(altPort, () => {
        console.info(`Sanjeevani API successfully started on fallback port ${altPort}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
});

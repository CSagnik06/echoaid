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
import adminRoutes from './routes/adminRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import { configureEmergencySocket } from './sockets/emergencySocket.js';
const app = express(), http = createServer(app), io = new Server(http, { cors: { origin: env.clientUrl, methods: ['GET', 'POST'] } });
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_q, r) => r.json({ success: true, data: { status: 'operational', database: databaseMode, demoMode: databaseMode === 'memory' } }));
app.use('/api/triage', triageRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/simplify-report', ocrRoutes);
app.use('/api/health-tracker', healthTrackerRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use((_q, r) => r.status(404).json({ success: false, message: 'Route not found' }));
app.use((error, _req, res, _next) => {
  console.error('Request failed:', error?.name || 'Error');
  res.status(500).json({ success: false, message: 'The server could not complete that request. Please try again.' });
});
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

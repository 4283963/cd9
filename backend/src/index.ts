import 'reflect-metadata';
import * as dotenv from 'dotenv';
import express from 'express';
import * as http from 'http';
import cors from 'cors';

import { initializeDatabase } from './database';
import { wsManager } from './websocket';
import { mockDataGenerator } from './mock';
import routes from './routes';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URLS = FRONTEND_URL.split(',').map(url => url.trim());
const MOCK_ENABLED = process.env.MOCK_ENABLED !== 'false';
const MOCK_INTERVAL = parseInt(process.env.MOCK_INTERVAL || '1000', 10);

async function startServer() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();

    const app = express();

    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || FRONTEND_URLS.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.use('/api', routes);

    app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        wsClients: wsManager.getClientCount(),
        mockEnabled: MOCK_ENABLED,
        mockRunning: mockDataGenerator.getRunningStatus(),
      });
    });

    const server = http.createServer(app);

    wsManager.attachToServer(server);

    wsManager.onMessage('ping', (message, clientId) => {
      wsManager.sendToClient(clientId, {
        type: 'pong',
        timestamp: Date.now(),
      });
    });

    if (MOCK_ENABLED) {
      console.log('Initializing mock data...');
      mockDataGenerator.configure({
        enabled: true,
        interval: MOCK_INTERVAL,
      });
      await mockDataGenerator.initialize();
      mockDataGenerator.start();
      console.log('Mock data generator started');
    }

    server.listen(PORT, () => {
      console.log('========================================');
      console.log('  地下矿道三维掘进数字孪生系统后端服务');
      console.log('========================================');
      console.log(`HTTP Server: http://localhost:${PORT}`);
      console.log(`WebSocket:  ws://localhost:${PORT}`);
      console.log(`Frontend:   ${FRONTEND_URL}`);
      console.log(`DB Mode:    ${process.env.DB_MODE || 'memory'}`);
      console.log(`Mock Mode:  ${MOCK_ENABLED ? 'Enabled' : 'Disabled'}`);
      console.log('========================================');
      console.log('API Endpoints:');
      console.log(`  GET    /api/`);
      console.log(`  GET    /health`);
      console.log(`  POST   /api/sensor`);
      console.log(`  GET    /api/sensor/history`);
      console.log(`  GET    /api/sensor/latest`);
      console.log(`  GET    /api/sensor/stats`);
      console.log(`  GET    /api/tbm/status`);
      console.log(`  GET    /api/tbm/history`);
      console.log(`  GET    /api/rock-layers`);
      console.log(`  GET    /api/groundwater`);
      console.log('========================================');
    });

    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      mockDataGenerator.stop();
      wsManager.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down gracefully...');
      mockDataGenerator.stop();
      wsManager.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

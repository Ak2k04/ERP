import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import materialRoutes from './routes/material';
import bomRoutes from './routes/bom';
import projectRoutes from './routes/project';
import generationRoutes from './routes/generation';
import storesRoutes from './routes/stores';
import logger from './utils/logger';

dotenv.config();

const app = express();
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
}));

// Body Parser
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/boms', bomRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/generate-bom', generationRoutes);
app.use('/api/v1/stores', storesRoutes);

// Error Handler
app.use(errorHandler);

export default app;

/**
 * CivicPulse - Server Entrypoint
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './api/routes.js';
import openaiRouter from './api/openaiRoutes.js';
import geminiRouter from './api/geminiRoutes.js';
import aiRouter from './api/aiRoutes.js';
import assistantRouter from './api/assistantRoutes.js';
import chatRouter from './api/chatRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evidenceDir = path.resolve(__dirname, '../frontend/public/evidence');

// Automatically load .env file if present
const candidateEnvFiles = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env')
];
for (const envPath of candidateEnvFiles) {
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
      console.log(`[Config] Loaded environment variables from ${path.basename(envPath)}`);
      break;
    } catch {
      // Ignore malformed env file warnings
    }
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve evidence assets statically
app.use('/evidence', express.static(evidenceDir));

// Request logger for demonstration transparency
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CivicPulse - Intelligent Civic Incident Coordination Platform',
    timestamp: new Date().toISOString()
  });
});

// Mount standard API routes
app.use('/api', apiRouter);

// Mount CivicPulse Assistant routes (Round 2)
app.use('/api/assistant', assistantRouter);

// Mount OpenAI integration routes
app.use('/api/openai', openaiRouter);

// Mount Gemini integration routes
app.use('/api/gemini', geminiRouter);

// Mount Unified AI integration & configuration routes
app.use('/api/ai', aiRouter);

// Mount 1-to-1 Citizen-Authority Private Chat routes
app.use('/api/chat', chatRouter);

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` CIVICPULSE API SERVER RUNNING ON PORT ${PORT}`);
  console.log(` Health:    http://localhost:${PORT}/health`);
  console.log(` API:       http://localhost:${PORT}/api/incidents`);
  console.log(` Assistant: http://localhost:${PORT}/api/assistant/suggested-questions`);
  console.log(` Chat API:  http://localhost:${PORT}/api/chat/conversations`);
  console.log(` AI Status: http://localhost:${PORT}/api/ai/status`);
  console.log(` OpenAI:    http://localhost:${PORT}/api/openai/health`);
  console.log(` Gemini:    http://localhost:${PORT}/api/gemini/health`);
  console.log(`=======================================================`);
});

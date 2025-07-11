import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index';
import routes from './routes/index';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { createApiLimiter } from './config/rateLimiter';
import './services/telegram-bot-manager';
import { agentService } from './services/agent';

// Initialize express app
const app = express();
const PORT = config.app.port;
// Trust proxy - required when running behind a reverse proxy (like Docker)
app.set('trust proxy', 1);

// Middlewares Security & Parsing
app.use(helmet());
config.railway.envName === 'production'
  ? app.use(cors({ origin: config.app.corsOrigin }))
  : app.use(cors());
app.use(express.json({ limit: config.app.uploadMaxJsonSize }));
app.use(createApiLimiter);

// --- Middlewares globaux ---
app.use(express.json());

// --- Routes API ---
app.use('/api', routes);

// --- Middlewares ---
app.use(notFoundHandler);
app.use(errorHandler);

// TODO: delete when we will have a proper template for the main agent
(async () => {
  await agentService.getOrCreateMainAgent();
})();

function shutdown() {
  console.log('🛑 Shutting down gracefully...');
  // Add cleanup logic for bots, timers, DB, etc.
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
app.listen(PORT, () => {
  console.log(`🌐 Server listening on port ${PORT}`);
});

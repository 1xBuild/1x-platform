import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index';
import { agentManager } from './services/letta/letta-agents';
import { discordBot } from './services/discord-bot';
import { telegramBot } from './services/telegram-bot';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { createApiLimiter } from './config/rateLimiter';

// Initialize express app
const app = express();
const PORT = config.app.port;
// Trust proxy - required when running behind a reverse proxy (like Docker)
app.set('trust proxy', 1);

// Middlewares Security & Parsing
app.use(helmet());
app.use(cors({ origin: config.app.corsOrigin }));
app.use(express.json({ limit: config.app.uploadMaxJsonSize }));
app.use(createApiLimiter);

// --- Middlewares globaux ---
//app.use(cors());
app.use(express.json());

// --- Routes API ---
app.use('/api', authRoutes);

// --- Middlewares ---
app.use(notFoundHandler);
app.use(errorHandler);

// Main function to initialize all bots services
async function initServices() {
  try {
    console.log('🚀 Starting bots services...');

    // Initialize the main agent
    const mainAgentId = await agentManager.getOrCreateMainAgent();
    console.log(`🤖 Main agent ID: ${mainAgentId}`);

    // Initialize the telegram bot
    await telegramBot.initialize(mainAgentId);

    // Start timers
    discordBot.startRandomEventTimer();

    console.log(`✅ All services initialized successfully!`);
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    process.exit(1);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`🌐 Server listening on port ${PORT}`);
  initServices();
});
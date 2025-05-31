import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index';
import { discordBot } from './services/discord-bot';
import { telegramBot } from './services/telegram-bot';
import routes from './routes/index';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { createApiLimiter } from './config/rateLimiter';
import { agentService } from './services/agent';
import { analystAgent } from './services/analyst-agent';

// Initialize express app
const app = express();
const PORT = config.app.port;
// Trust proxy - required when running behind a reverse proxy (like Docker)
app.set('trust proxy', 1);

// Middlewares Security & Parsing
app.use(helmet());
config.railway.envName === 'production' ? app.use(cors({ origin: config.app.corsOrigin })) : app.use(cors());
app.use(express.json({ limit: config.app.uploadMaxJsonSize }));
app.use(createApiLimiter);

// --- Middlewares globaux ---
//app.use(cors());
app.use(express.json());

// --- Routes API ---
app.use('/api', routes);

// --- Middlewares ---
app.use(notFoundHandler);
app.use(errorHandler);

// Main function to initialize all bots services
async function initServices() {
  try {
    console.log('🚀 Starting bots services...');

    // Initialize the main agent
    const mainAgentId = await agentService.getOrCreateMainAgent();
    console.log(`🤖 Main agent ID: ${mainAgentId}`);

    // Set mainAgentId for analystAgent and start it
    await analystAgent.setMainAgentId(mainAgentId);
    analystAgent.start();

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
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index';
import { discordBot } from './services/discord-bot';
import routes from './routes/index';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { createApiLimiter } from './config/rateLimiter';
import { telegramBotManager } from './services/telegram-bot-manager';
import { listAllTriggers } from './database/db';
// import { analystAgent } from './services/analyst-agent';

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

// Main function to initialize essential services
async function initServices() {
  try {
    // Restart previously enabled bots after cleanup
    await restartPreviouslyEnabledBots();

    console.log(`✅ Essential services initialized successfully!`);
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    process.exit(1);
  }
}

/**
 * Restart bots that were enabled before server restart
 * This runs after cleanupOrphanedConnections() has marked all bots as stopped
 */
async function restartPreviouslyEnabledBots() {
  try {
    console.log('🔄 Checking for enabled triggers to restart bots...');

    // Get all enabled telegram triggers
    const enabledTriggers = listAllTriggers().filter(
      (t) => t.type === 'telegram' && t.enabled,
    );

    if (enabledTriggers.length === 0) {
      console.log('✅ No enabled Telegram triggers found');
      return;
    }

    console.log(
      `🤖 Found ${enabledTriggers.length} enabled Telegram trigger(s), restarting bots...`,
    );

    for (const trigger of enabledTriggers) {
      try {
        console.log(`🤖 Restarting Telegram bot for agent ${trigger.agent_id}`);
        await telegramBotManager.start(trigger.agent_id);
        console.log(
          `✅ Successfully restarted bot for agent ${trigger.agent_id}`,
        );
      } catch (error) {
        console.warn(
          `⚠️ Failed to restart bot for agent ${trigger.agent_id}:`,
          error,
        );
      }
    }

    console.log('🔄 Bot restart process completed');
  } catch (error) {
    console.warn('⚠️ Error during bot restart process:', error);
  }
}

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
  initServices();
});

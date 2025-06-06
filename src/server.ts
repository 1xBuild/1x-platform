import 'dotenv/config';
import express from 'express';
import { config } from './config/index';
import { getOrCreateMainAgent } from './services/agents';
import { discordBot } from './services/discord-bot';
import { telegramBot } from './services/telegram-bot';

// Initialize express app
const app = express();
const PORT = config.app.port;

// Main function to initialize all services
async function init() {
  try {
    console.log('🚀 Starting application...');

    // Initialize the main agent
    const mainAgentId = await getOrCreateMainAgent();
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
  init();
});
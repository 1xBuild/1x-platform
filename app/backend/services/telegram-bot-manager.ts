import { TelegramBot } from './telegram-bot';
import { config } from '../config';
import {
  getBotByAgentAndType,
  upsertBot,
  getActiveBotsByType,
  getBotsByAgentId,
  getRunningBotByAgentAndType,
  getAllRunningBotsByType,
} from '../database/db';

export class TelegramBotManager {
  // Completely stateless - database is the ONLY source of truth

  constructor() {
    // On startup, clean up any orphaned bot connections
    // This is needed in case of a restart when bot stopped running but are still marked as running in database
    this.cleanupOrphanedConnections();
  }

  private async cleanupOrphanedConnections() {
    try {
      console.log('🧹 Checking for orphaned Telegram bot connections...');
      const runningBots = getAllRunningBotsByType('telegram');

      if (runningBots.length > 0) {
        console.log(
          `⚠️ Found ${runningBots.length} bots marked as running in database but not in memory`,
        );

        // Mark all as stopped since we don't have active instances
        for (const bot of runningBots) {
          console.log(
            `🛑 Marking orphaned bot as stopped for agent ${bot.agent_id}`,
          );
          upsertBot({
            agent_id: bot.agent_id,
            type: 'telegram',
            status: 'stopped',
            last_stopped: new Date().toISOString(),
          });
        }

        console.log('✅ Orphaned bot connections cleaned up');
      } else {
        console.log('✅ No orphaned bot connections found');
      }
    } catch (error) {
      console.warn('⚠️ Error during orphaned connection cleanup:', error);
    }
  }

  public async start(
    agentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        '[TELEGRAM-BOT-MANAGER] Starting Telegram bot for agent:',
        agentId,
      );

      // Create a new bot instance and start it
      const bot = new TelegramBot();
      console.log('[TELEGRAM-BOT-MANAGER] Bot instance created');

      try {
        await bot.start(agentId);
        console.log('[TELEGRAM-BOT-MANAGER] Bot started successfully');
      } catch (error) {
        // Bot failed to start - capture the specific error message for frontend
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(
          `❌ Failed to start Telegram bot for agent ${agentId}: ${errorMessage}`,
        );

        // Update database with specific error message for frontend
        upsertBot({
          agent_id: agentId,
          type: 'telegram',
          status: 'error',
          error_message: errorMessage,
        });

        // Return failure result instead of throwing
        return { success: false, error: errorMessage };
      }

      // Bot started successfully - update database status
      upsertBot({
        agent_id: agentId,
        type: 'telegram',
        status: 'running',
        last_started: new Date().toISOString(),
        error_message: undefined, // Clear any previous errors
      });

      console.log(`✅ Telegram bot started successfully for agent ${agentId}`);
      return { success: true };
    } catch (error) {
      // This catch is for any unexpected errors (database, etc.)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `⚠️ Unexpected error in telegram bot manager for agent ${agentId}:`,
        errorMessage,
      );

      // Try to update database even if there was an unexpected error
      try {
        upsertBot({
          agent_id: agentId,
          type: 'telegram',
          status: 'error',
          error_message: `Manager error: ${errorMessage}`,
        });
      } catch (dbError) {
        console.error(
          '❌ Failed to update database with error status:',
          dbError,
        );
      }

      return { success: false, error: `Manager error: ${errorMessage}` };
    }
  }

  public async stop(agentId: string) {
    console.log(`🛑 Stopping Telegram bot for agent ${agentId}`);

    try {
      // Update database status - this will cause the bot to stop responding
      // The bot checks database state on every message
      upsertBot({
        agent_id: agentId,
        type: 'telegram',
        status: 'stopped',
        last_stopped: new Date().toISOString(),
      });

      console.log(`✅ Telegram bot marked as stopped for agent ${agentId}`);
    } catch (error) {
      console.error(
        `⚠️ Error stopping Telegram bot for agent ${agentId}:`,
        error,
      );
      throw error;
    }
  }

  public isRunning(agentId: string): boolean {
    // Simple database check - bots self-manage based on this
    const dbBot = getBotByAgentAndType(agentId, 'telegram');
    return dbBot?.status === 'running';
  }

  public getActiveBotsCount(): number {
    // Use the database helper function to get active telegram bots
    return getActiveBotsByType('telegram').length;
  }

  public async sendMessageToGroup(
    agentId: string,
    message: string,
  ): Promise<void> {
    // Check if we have an active bot in database
    if (!this.isRunning(agentId)) {
      throw new Error('No active bot found for this agent');
    }

    if (!config.telegram.mainChatId) {
      throw new Error('TELEGRAM_MAIN_CHAT_ID is not configured');
    }

    try {
      // Create a temporary bot instance just for sending this message
      const bot = new TelegramBot();
      await bot.start(agentId); // This initializes the bot with the correct token

      await bot['bot'].telegram.sendMessage(
        config.telegram.mainChatId,
        message,
      );

      // Stop the temporary instance
      await bot.stop();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

export const telegramBotManager = new TelegramBotManager();

import { TelegramBot } from './telegram-bot';
import { config } from '../config';
import {
  getBotByAgentAndType,
  upsertBot,
  getAllRunningBotsByType,
  listAllTriggers,
  getTriggersByAgentId,
} from '../database/db';
import { resolveTriggerSecrets } from './triggers/trigger-manager';

export class TelegramBotManager {
  // Store active bot instances in memory for reuse
  private activeBots: Map<string, TelegramBot> = new Map();

  constructor() {
    // On startup, clean up any orphaned bot connections
    // This is needed in case of a restart when bot stopped running but are still marked as running in database
    this.cleanupOrphanedConnections();

    // Restart previously enabled bots
    this.restartPreviouslyEnabledBots();
  }

  private async cleanupOrphanedConnections() {
    try {
      console.log('🧹 Checking for orphaned Telegram bot connections...');

      // Store which bots were running before cleanup (for restart decision)
      const botsRunningBeforeCleanup = getAllRunningBotsByType('telegram').map(
        (bot) => bot.agent_id,
      );

      // Clear any existing instances in memory first
      for (const [agentId, bot] of this.activeBots) {
        try {
          console.log(`🛑 Stopping orphaned bot instance for agent ${agentId}`);
          await bot.stop();
        } catch (error) {
          console.warn(
            `⚠️ Error stopping orphaned bot for agent ${agentId}:`,
            error,
          );
        }
      }
      this.activeBots.clear();

      // Mark all bots as stopped in database since we don't have active instances
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

      // Store the list for restart logic
      (this as any).botsToRestart = botsRunningBeforeCleanup;
    } catch (error) {
      console.warn('⚠️ Error during orphaned connection cleanup:', error);
      (this as any).botsToRestart = [];
    }
  }

  /**
   * Restart bots that were BOTH enabled (trigger) AND running (bot) before server restart
   */
  private async restartPreviouslyEnabledBots() {
    try {
      console.log('🔄 Checking for enabled triggers to restart bots...');

      // Get which bots were running before cleanup
      const botsToRestart = (this as any).botsToRestart || [];

      if (botsToRestart.length === 0) {
        console.log('✅ No bots were running before restart');
        return;
      }

      // Get all enabled telegram triggers
      const enabledTriggers = listAllTriggers().filter(
        (t) => t.type === 'telegram' && t.enabled,
      );

      if (enabledTriggers.length === 0) {
        console.log('✅ No enabled Telegram triggers found');
        return;
      }

      // ✅ Only restart bots that were BOTH running before restart AND have enabled triggers
      const botsToActuallyRestart = enabledTriggers.filter((trigger) =>
        botsToRestart.includes(trigger.agent_id),
      );

      if (botsToActuallyRestart.length === 0) {
        console.log(
          '✅ No bots need to be restarted (all were intentionally stopped)',
        );
        return;
      }

      console.log(
        `🤖 Found ${botsToActuallyRestart.length} bot(s) that were running before restart, restarting...`,
      );

      for (const trigger of botsToActuallyRestart) {
        try {
          console.log(
            `🤖 Restarting Telegram bot for agent ${trigger.agent_id}`,
          );
          const result = await this.start(trigger.agent_id);

          if (result.success) {
            console.log(
              `✅ Successfully restarted bot for agent ${trigger.agent_id}`,
            );
          } else {
            console.warn(
              `⚠️ Failed to restart bot for agent ${trigger.agent_id}: ${result.error}`,
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ Failed to restart bot for agent ${trigger.agent_id}:`,
            error,
          );
        }
      }

      console.log('🔄 Bot restart process completed');

      // Clean up the temporary storage
      delete (this as any).botsToRestart;
    } catch (error) {
      console.warn('⚠️ Error during bot restart process:', error);
    }
  }

  public async start(
    agentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if bot is already running in memory
      if (this.activeBots.has(agentId)) {
        console.log(`✅ Telegram bot already running for agent ${agentId}`);
        return { success: true };
      }

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

        // Store the persistent instance in memory
        this.activeBots.set(agentId, bot);
      } catch (error) {
        // Bot failed to start - capture the specific error message for frontend
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(
          `❌ Failed to start Telegram bot for agent ${agentId}: ${errorMessage}`,
        );

        bot.stop();
        this.activeBots.delete(agentId);

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
      // Stop the actual bot instance if it exists
      const bot = this.activeBots.get(agentId);
      if (bot) {
        await bot.stop();
        this.activeBots.delete(agentId);
        console.log(`✅ Stopped and removed bot instance for agent ${agentId}`);
      }

      // Update database status
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
      // Even if stopping failed, remove from memory and mark as stopped in DB
      this.activeBots.delete(agentId);
      throw error;
    }
  }

  public isRunning(agentId: string): boolean {
    // Check both memory and database for consistency
    const hasInstance = this.activeBots.has(agentId);
    const dbBot = getBotByAgentAndType(agentId, 'telegram');
    const dbRunning = dbBot?.status === 'running';

    // If there's a mismatch, log it for debugging
    if (hasInstance !== dbRunning) {
      console.warn(
        `⚠️ State mismatch for agent ${agentId}: memory=${hasInstance}, db=${dbRunning}`,
      );
    }

    // Bot is considered running if both memory and DB agree
    return hasInstance && dbRunning;
  }

  public getActiveBotsCount(): number {
    return this.activeBots.size;
  }

  /**
   * Send message using existing persistent bot instance (no more ephemeral bots!)
   */
  public async sendMessageToGroup(
    agentId: string,
    message: string,
  ): Promise<void> {
    // Check if we have an active bot in database
    if (!this.isRunning(agentId)) {
      throw new Error('No active bot found for this agent');
    }

    const telegramTriggers = getTriggersByAgentId(agentId);
    const telegramTrigger = telegramTriggers.find(
      (t) => t.type === 'scheduled' && t.enabled && t.config.message,
    );

    if (!telegramTrigger) {
      throw new Error(
        'Telegram trigger is not set - cannot send message to group',
      );
    }

    // Get secrets from database
    const telegramSecrets = resolveTriggerSecrets(telegramTrigger, agentId);

    // Check for required token
    if (!telegramSecrets.TELEGRAM_MAIN_CHAT_ID) {
      throw new Error(
        'TELEGRAM_MAIN_CHAT_ID is required to send message but not found in secrets',
      );
    }

    // Get existing persistent bot instance
    const bot = this.activeBots.get(agentId);
    if (!bot) {
      throw new Error(
        `Bot marked as running in DB but no instance found for agent ${agentId}. This indicates a state synchronization issue.`,
      );
    }

    try {
      // Use the persistent bot instance - no start/stop cycle needed!
      await bot.sendDirectMessage(
        telegramSecrets.TELEGRAM_MAIN_CHAT_ID,
        message,
      );
      console.log(`📤 Message sent via existing bot for agent ${agentId}`);
    } catch (error) {
      console.error(
        `❌ Error sending message via bot for agent ${agentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get list of active bot agent IDs
   */
  public getActiveBotAgentIds(): string[] {
    return Array.from(this.activeBots.keys());
  }

  /**
   * Get status of all active bots
   */
  public getActiveBotsStatus(): Array<{ agentId: string; isRunning: boolean }> {
    return Array.from(this.activeBots.keys()).map((agentId) => ({
      agentId,
      isRunning: this.isRunning(agentId),
    }));
  }

  /**
   * Update the Telegram secrets
   * @param agentId - The agent ID
   * @param secrets - The new secrets to update
   */
  public updateTelegramSecrets(
    agentId: string,
    secrets: Record<string, string>,
  ): void {
    const bot = this.activeBots.get(agentId);
    if (bot) {
      bot.updateTelegramSecrets(secrets);
    }
  }
}

export const telegramBotManager = new TelegramBotManager();

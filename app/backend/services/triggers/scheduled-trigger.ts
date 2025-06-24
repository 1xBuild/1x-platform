import * as cron from 'node-cron';
import { listScheduledTriggers } from '../../database/db';
import { lettaMessageAdapter } from '../letta/letta-messages';
import { telegramBotManager } from '../telegram-bot-manager';
import { config } from '../../config';

interface ScheduledTask {
  triggerId: string;
  task: cron.ScheduledTask;
}

class ScheduledTriggerManager {
  private activeTasks: Map<string, ScheduledTask> = new Map();

  constructor() {
    // Initialize on startup
    this.initializeScheduledTriggers();
  }

  /**
   * Initialize all scheduled triggers from database
   */
  async initializeScheduledTriggers() {
    console.log('[ScheduledTrigger] Initializing scheduled triggers...');
    try {
      const triggers = listScheduledTriggers();

      for (const trigger of triggers) {
        await this.addScheduledTrigger(trigger);
      }

      console.log(
        `[ScheduledTrigger] Initialized ${triggers.length} scheduled triggers`,
      );
    } catch (error) {
      console.error('[ScheduledTrigger] Failed to initialize triggers:', error);
    }
  }

  /**
   * Add a new scheduled trigger
   */
  async addScheduledTrigger(trigger: any) {
    try {
      const { schedule, timezone = 'UTC', message } = trigger.config;

      if (!schedule) {
        console.error(
          `[ScheduledTrigger] No schedule found for trigger ${trigger.id}`,
        );
        return;
      }

      // Validate cron expression
      if (!cron.validate(schedule)) {
        console.error(
          `[ScheduledTrigger] Invalid cron expression: ${schedule} for trigger ${trigger.id}`,
        );
        return;
      }

      // Remove existing task if it exists
      this.removeScheduledTrigger(trigger.id);

      // Create new scheduled task
      const task = cron.schedule(
        schedule,
        async () => {
          await this.executeTrigger(trigger, message);
        },
        {
          timezone: timezone,
        },
      );

      this.activeTasks.set(trigger.id, {
        triggerId: trigger.id,
        task,
      });

      console.log(
        `[ScheduledTrigger] Added trigger ${trigger.id} with schedule "${schedule}" (timezone: ${timezone})`,
      );
    } catch (error) {
      console.error(
        `[ScheduledTrigger] Failed to add trigger ${trigger.id}:`,
        error,
      );
    }
  }

  /**
   * Remove a scheduled trigger
   */
  removeScheduledTrigger(triggerId: string) {
    const scheduledTask = this.activeTasks.get(triggerId);
    if (scheduledTask) {
      scheduledTask.task.destroy();
      this.activeTasks.delete(triggerId);
      console.log(`[ScheduledTrigger] Removed trigger ${triggerId}`);
    }
  }

  /**
   * Update a scheduled trigger
   */
  async updateScheduledTrigger(trigger: any) {
    // Remove old and add new
    this.removeScheduledTrigger(trigger.id);
    await this.addScheduledTrigger(trigger);
  }

  /**
   * Execute a scheduled trigger
   */
  private async executeTrigger(trigger: any, message: string) {
    console.log(
      `[ScheduledTrigger] Executing trigger ${trigger.id} for agent ${trigger.agent_id}`,
    );

    // ✅ Dependency Check: Only execute if telegram bot is running
    if (!telegramBotManager.isRunning(trigger.agent_id)) {
      console.log(
        `📅 [ScheduledTrigger] Skipping trigger ${trigger.id} - telegram bot is not running for agent ${trigger.agent_id}. Will retry on next schedule.`,
      );
      return;
    }

    try {
      // Send message to main agent (Letta)
      const stream = await lettaMessageAdapter.sendStreamMessage(
        config.letta.agentId || trigger.agent_id,
        {
          role: 'system',
          content: message,
        },
      );

      const response = await lettaMessageAdapter.processStream(stream);

      // Send response to Telegram group (bot is confirmed running)
      await telegramBotManager.sendMessageToGroup(trigger.agent_id, response);

      console.log(
        `[ScheduledTrigger] Successfully executed trigger ${trigger.id}`,
      );
    } catch (error) {
      console.error(
        `[ScheduledTrigger] Error executing trigger ${trigger.id}:`,
        error,
      );
    }
  }

  /**
   * Get status of all active scheduled triggers
   */
  getActiveTriggersStatus() {
    const status = Array.from(this.activeTasks.entries()).map(
      ([triggerId, { task }]) => ({
        triggerId,
        isRunning: task.getStatus() === 'scheduled',
      }),
    );

    console.log(`[ScheduledTrigger] Active triggers: ${status.length}`);
    return status;
  }

  /**
   * Refresh all triggers from database (useful when triggers are updated via API)
   */
  async refreshTriggers() {
    console.log('[ScheduledTrigger] Refreshing all triggers...');

    // Stop all current tasks
    for (const [triggerId] of this.activeTasks) {
      this.removeScheduledTrigger(triggerId);
    }

    // Reinitialize from database
    await this.initializeScheduledTriggers();
  }
}

// Export singleton instance
export const scheduledTriggerManager = new ScheduledTriggerManager();

/**
 * Start the scheduled trigger system
 * @deprecated Use scheduledTriggerManager directly
 */
export function startScheduledTriggerWorker() {
  console.log(
    '[ScheduledTrigger] Using new cron-based scheduler. Old worker method is deprecated.',
  );
  // The manager initializes automatically when imported
}

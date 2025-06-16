import { listScheduledTriggersToFire } from '../database/db';
import { lettaMessageAdapter } from './letta/letta-messages';
import { telegramBotManager } from './telegram-bot-manager';
import { config } from '../config';

export function startScheduledTriggerWorker() {
  setInterval(async () => {
    console.log('[ScheduledTrigger] Started, system time:', new Date().toISOString());
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const triggers = listScheduledTriggersToFire(currentHour, currentMinute);
      if (triggers.length === 0) return;
      for (const trigger of triggers) {
        console.log(`[ScheduledTrigger] Processing trigger for agent ${trigger.agent_id} at hour ${currentHour}:${currentMinute}`);
        try {
          // Send message to main agent (Letta)
          const stream = await lettaMessageAdapter.sendStreamMessage(
            config.letta.agentId || trigger.agent_id,
            {
              role: 'system',
              content: trigger.message,
            }
          );
          const response = await lettaMessageAdapter.processStream(stream);
          // Send response to Telegram group
          await telegramBotManager.sendMessageToGroup(trigger.agent_id, response);
          console.log(
            `[ScheduledTrigger] Sent scheduled message for agent ${trigger.agent_id} at hour ${currentHour}:${currentMinute}`
          );
        } catch (err) {
          console.error(
            `[ScheduledTrigger] Error processing trigger for agent ${trigger.agent_id}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error('[ScheduledTrigger] Worker error:', err);
    }
  }, 60 * 1000); // Every minute
}

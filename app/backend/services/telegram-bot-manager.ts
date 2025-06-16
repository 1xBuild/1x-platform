import { TelegramBot } from './telegram-bot';
import { config } from '../config';

export class TelegramBotManager {
  private bots: Map<string, TelegramBot> = new Map();

  public async start(agentId: string) {
    if (!this.bots.has(agentId)) {
      const bot = new TelegramBot();
      await bot.start(agentId);
      this.bots.set(agentId, bot);
    } else {
      await this.bots.get(agentId)!.start(agentId);
    }
  }

  public stop(agentId: string) {
    if (this.bots.has(agentId)) {
      this.bots.get(agentId)!.stop();
      this.bots.delete(agentId);
    }
  }

  public isRunning(agentId: string) {
    return this.bots.has(agentId) && this.bots.get(agentId)!.isRunning();
  }

  public async sendMessageToGroup(agentId: string, message: string): Promise<void> {
    if (!this.bots.has(agentId)) {
      throw new Error('Telegram bot not running for this agent');
    }
    const bot = this.bots.get(agentId)!;
    if (!config.telegram.mainChatId) {
      throw new Error('TELEGRAM_MAIN_CHAT_ID is not configured');
    }
    await bot['bot'].telegram.sendMessage(config.telegram.mainChatId, message);
  }
}

export const telegramBotManager = new TelegramBotManager();

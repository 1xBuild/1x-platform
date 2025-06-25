import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from '../config/index';
import { agentService } from './agent';
import { sendMessage, sendTimerMessage, MessageType } from './message-service';
import { openaiService } from './openai';
import { p33lyShouldAnswerPromptTemplate, parseTemplate } from '../data/prompt';
import * as LettaTypes from '@letta-ai/letta-client/api/types';
import { getTriggersByAgentId, GenericTrigger } from '../database/db';
import {
  evaluateShouldAnswerRule,
  resolveTriggerSecrets,
} from './triggers/trigger-manager';

// Define the expected JSON structure from the LLM
interface ShouldAnswerResponse {
  answer: 'yes' | 'no';
  reason: string;
}

export class TelegramBot {
  private bot: Telegraf<Context>;
  private agentId: string = '';
  private messageHistory: Map<string, Array<{ text: string; sender: string }>> =
    new Map(); // chatId -> message history with sender info
  private startTime: number = Math.floor(Date.now() / 1000); // UNIX timestamp in seconds
  private running = false;
  private telegramTrigger: GenericTrigger | null = null;
  private telegramSecrets: Record<string, string> = {};

  constructor() {
    // Bot will be initialized later when we have the agent-specific configuration
    this.bot = new Telegraf(''); // Temporary empty token
    // Set up event handlers
    this.setupEventHandlers();
  }

  public async start(agentId?: string) {
    if (agentId) {
      this.agentId = agentId;
    }
    if (!this.agentId) {
      throw new Error('agentId is not set');
    }

    // Fetch the telegram trigger config for this agent
    const triggers = getTriggersByAgentId(this.agentId);
    this.telegramTrigger = triggers.find((t) => t.type === 'telegram') || null;

    if (!this.telegramTrigger) {
      throw new Error('No Telegram trigger found for this agent');
    }

    // Get secrets from database
    this.telegramSecrets = resolveTriggerSecrets(
      this.telegramTrigger,
      this.agentId,
    );

    // Check for required token
    if (!this.telegramSecrets.TELEGRAM_BOT_TOKEN) {
      throw new Error(
        'TELEGRAM_BOT_TOKEN is required but not found in secrets',
      );
    }

    // Initialize bot with the token from database
    try {
      this.bot = new Telegraf(this.telegramSecrets.TELEGRAM_BOT_TOKEN);
      this.setupEventHandlers(); // Re-setup handlers with new bot instance
      await this.initialize(this.agentId);
      this.running = true;
    } catch (error) {
      console.error('[TELEGRAM-BOT] Error creating bot instance:', error);
      throw error;
    }
  }

  /**
   * Initialize the Telegram bot
   * Returns a promise that resolves when bot is successfully launched or rejects with specific error
   */
  public async initialize(agentId: string): Promise<void> {
    this.agentId = agentId;

    // Use Promise.race to handle bot launch with timeout
    // bot.launch() never resolves on success, so we race it against a timeout to consider it successful
    try {
      await Promise.race([
        // The actual bot launch
        this.bot.launch({ dropPendingUpdates: true }),

        // Timeout after 5 seconds - if we reach this, the bot launched successfully
        new Promise((resolve) => {
          setTimeout(() => {
            resolve('success');
          }, 3000);
        }),
      ]);

      // If we get here without error, the bot launched successfully
      this.startTime = Math.floor(Date.now() / 1000);

      // Enable graceful stop
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      console.error('❌ Failed to launch Telegram bot:', error);

      // Create specific error messages for different failure types
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found')
        ) {
          throw new Error(
            'Invalid Telegram bot token. Please check your TELEGRAM_BOT_TOKEN secret.',
          );
        }
        if (
          errorMessage.includes('401') ||
          errorMessage.includes('Unauthorized')
        ) {
          throw new Error(
            'Unauthorized Telegram bot token. The token may be revoked or invalid.',
          );
        }
        if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
          throw new Error(
            'Another bot instance is already running with this token. Please stop other instances first.',
          );
        }
      }

      // For any other errors, provide a generic message with the original error
      const originalError =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to start Telegram bot: ${originalError}`);
    }
  }

  /**
   * Set up all Telegram event handlers
   */
  private setupEventHandlers(): void {
    // Handle /start command for DMs (equivalent to starting a coaching session)
    this.bot.command('start', this.handleDirectMessage.bind(this));

    // Handle incoming text messages
    this.bot.on(message('text'), this.handleTextMessage.bind(this));
    console.log('🤖 Telegram bot setup complete');

    // TODO: Add more handlers as needed (e.g., for other commands, different message types)
  }

  /**
   * Handle the /start command (typically in DMs)
   */
  private async handleStartCommand(ctx: Context): Promise<void> {
    if (ctx.chat && ctx.chat.type === 'private' && ctx.from) {
      console.log(
        `📩 Received /start command from ${ctx.from.username} (ID: ${ctx.from.id})`,
      );
      // Treat this as starting a new coaching session, similar to a DM in Discord
      await this.processAndSendMessage(ctx, MessageType.DM);
    } else {
      // Potentially ignore /start command in group chats or provide a different response
      console.log(
        '📩 Received /start command in non-private chat or without user info, ignoring for now.',
      );
    }
  }

  /**
   * Add a message to the history for a specific chat
   */
  private addMessageToHistory(
    chatId: string,
    message: string,
    senderId: string,
  ): void {
    if (!this.messageHistory.has(chatId)) {
      this.messageHistory.set(chatId, []);
    }
    const history = this.messageHistory.get(chatId)!;

    // Determine if the sender is P33ly (the bot)
    const sender =
      this.telegramSecrets.TELEGRAM_BOT_ID &&
      senderId === this.telegramSecrets.TELEGRAM_BOT_ID
        ? 'P33ly'
        : `User_${senderId}`;

    history.push({ text: message, sender });
    // Keep only the last 10 messages
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Get recent messages for a specific chat
   */
  private getRecentMessages(chatId: string, limit: number = 3): string[] {
    const history = this.messageHistory.get(chatId) || [];
    return history.slice(-limit).map((msg) => `${msg.sender}: ${msg.text}`);
  }

  /**
   * Handle incoming text messages
   */
  private async handleTextMessage(ctx: Context): Promise<void> {
    // Always check current database state instead of cached trigger
    const currentTriggers = getTriggersByAgentId(this.agentId);
    const currentTelegramTrigger =
      currentTriggers.find((t) => t.type === 'telegram') || null;

    // If trigger doesn't exist or is disabled, ignore the message
    if (!currentTelegramTrigger || !currentTelegramTrigger.enabled) {
      console.log(
        '🤖 Received message but Telegram trigger is disabled or not found.',
      );
      return;
    }

    console.log(
      `📩 Received message from ${ctx.from?.username}: ${ctx.message?.chat.id}`,
    );

    // Ensure 'message' and 'text' properties exist
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) {
      console.log('📩 Ignoring message without text or sender info.');
      return;
    }

    const messageText = ctx.message.text;
    const userId = ctx.from.id;
    const username = ctx.from.username || `User_${userId}`;

    // Ignore messages from before the bot was started
    if (ctx.message.date < this.startTime) {
      console.log('Ignoring old message:', ctx.message.text);
      return;
    }

    // If it's a /start command, let handleStartCommand deal with it.
    if (messageText.trim().toLowerCase() === '/start') {
      console.log('📩 Text message is /start, deferring to command handler.');
      return;
    }

    // Ignore messages from the bot itself (if TELEGRAM_BOT_ID is set)
    if (
      this.telegramSecrets.TELEGRAM_BOT_ID &&
      userId.toString() === this.telegramSecrets.TELEGRAM_BOT_ID
    ) {
      console.log(`📩 Ignoring message from myself...`);
      return;
    }

    // Handle test commands
    if (messageText.trim().toLowerCase() === '!testprogram') {
      console.log(`📩 Received test program command from ${username}`);
      // You might want to send a reply for test commands
      // await ctx.reply("Test program command received!");
      return;
    }

    // Ignore messages that start with ! (unless it's a command you want to handle)
    if (
      messageText.startsWith('!') &&
      messageText.trim().toLowerCase() !== '!testprogram'
    ) {
      console.log(`📩 Ignoring message that starts with ! from ${username}...`);
      return;
    }

    // Handle Direct Messages (private chats)
    if (ctx.chat && ctx.chat.type === 'private') {
      await this.handleDirectMessage(ctx);
      return;
    }

    // Handle mentions (in group chats)
    // Telegraf's `ctx.message.entities` can be used to detect mentions.
    // A message entity of type 'mention' for the bot's username indicates a mention.
    // Or, if the message is a reply to the bot's message.
    const botUsername = (await ctx.telegram.getMe()).username;
    const isMentioned =
      ctx.message.entities?.some(
        (entity: { type: string; offset: number; length: number }) =>
          entity.type === 'mention' &&
          messageText.substring(
            entity.offset,
            entity.offset + entity.length,
          ) === `@${botUsername}`,
      ) ||
      (ctx.message.reply_to_message &&
        ctx.message.reply_to_message.from?.username === botUsername);

    // Check if should respond to mentions or replies
    const respondToMentions =
      this.telegramSecrets.TELEGRAM_RESPOND_TO_MENTIONS !== 'false';
    if (
      (respondToMentions && isMentioned) ||
      (ctx.message.reply_to_message &&
        ctx.message.reply_to_message.from?.username === botUsername)
    ) {
      console.log(`📩 Received mention/reply from ${username}, handling...`);
      await this.handleMentionOrReply(ctx);
      return;
    }

    // Handle generic messages in groups (if the bot is part of the group and configured to respond)
    // This would typically be for groups where the bot is explicitly added and configured to listen.
    const respondToGeneric =
      this.telegramSecrets.TELEGRAM_RESPOND_TO_GENERIC !== 'false';
    if (respondToGeneric && ctx.chat) {
      console.log(`🤖 Handling generic message in group ${ctx.chat.id}`);
      // Use shouldAnswer from current trigger config
      if (
        currentTelegramTrigger &&
        currentTelegramTrigger.config.shouldAnswer
      ) {
        // Add current message to history
        if (ctx.message && 'text' in ctx.message && ctx.from) {
          this.addMessageToHistory(
            ctx.chat.id.toString(),
            ctx.message.text,
            ctx.from.id.toString(),
          );
        }

        // Get recent messages
        const messageHistory = this.getRecentMessages(
          ctx.chat.id.toString(),
          3,
        );
        const shouldAnswer = await evaluateShouldAnswerRule(
          currentTelegramTrigger,
          {
            message: ctx.message.text,
            messageType: 'generic',
            history: messageHistory.reverse(),
            env: this.telegramSecrets,
          },
        );
        if (shouldAnswer) {
          await this.handleGenericMessage(ctx);
        } else {
          console.log(
            `🤖 LLM says NO to responding based on user's defined rule.`,
          );
        }
        return;
      } else {
        // Fallback to original generic message handling if LLM decision is disabled
        await this.handleGenericMessage(ctx);
        return;
      }
    }

    console.log(
      `📩 Received message from ${username} in chat ${ctx.chat?.id}, but no specific handler matched.`,
    );
  }

  /**
   * Handle direct messages (private chats)
   */
  private async handleDirectMessage(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;
    console.log(
      `📩 Received DM from ${ctx.from.username}: ${ctx.message.text}`,
    );
    const respondToDms =
      this.telegramSecrets.TELEGRAM_RESPOND_TO_DMS === 'true';
    if (respondToDms) {
      await this.processAndSendMessage(ctx, MessageType.DM);
    } else {
      console.log(`📩 Ignoring DM...`);
      await ctx.reply(
        "I'm not configured to respond to direct messages currently.",
      );
    }
  }

  /**
   * Handle mentions and replies in group chats
   */
  private async handleMentionOrReply(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;
    console.log(
      `📩 Received mention/reply from ${ctx.from.username}: ${ctx.message.text}`,
    );

    // Telegraf doesn't have a direct sendTyping equivalent that works universally like Discord.js.
    // We can use `ctx.telegram.sendChatAction(ctx.chat.id, 'typing')`
    if (ctx.chat) {
      try {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
      } catch (error) {
        console.log('Could not send typing indicator:', error);
      }
    }

    // If it's a reply to the bot, the original message is in ctx.message.reply_to_message
    // For mentions, there isn't a direct "original message" in the same way unless it's also a reply.
    // We will adapt the sendMessage to accept Context and extract necessary info.
    const messageType = ctx.message.reply_to_message
      ? MessageType.REPLY
      : MessageType.MENTION;

    // Construct MessagePayload from Telegraf context
    if (!ctx.message || !('text' in ctx.message) || !ctx.from || !ctx.chat)
      return;
    const payload: LettaTypes.MessageCreate = {
      content: ctx.message.text,
      senderId: ctx.from.id.toString(),
      name: ctx.from.username || `User_${ctx.from.id}`,
      role: 'user',
      // channelId: ctx.chat.id.toString() // Not strictly needed by sendMessage now
    };
    const responseText = await sendMessage(payload, messageType, this.agentId);

    if (responseText !== '') {
      await ctx.reply(responseText);
    }
  }

  /**
   * Handle generic messages in configured group chats
   */
  private async handleGenericMessage(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;
    console.log(
      `📩 Received generic group message from ${ctx.from.username}: ${ctx.message.text}`,
    );
    await this.processAndSendMessage(ctx, MessageType.GENERIC);
  }

  /**
   * Process a message and send a response
   */
  private async processAndSendMessage(
    ctx: Context,
    messageType: MessageType,
    existingAgentId?: string,
  ): Promise<void> {
    if (!ctx.from || !ctx.chat) {
      console.error('🛑 Error: Missing user or chat information in context.');
      await ctx.reply(
        '❌ Sorry, I could not identify you or the chat. Please try again.',
      );
      return;
    }

    try {
      let agentId = existingAgentId || this.agentId;

      if (messageType === MessageType.DM) {
        agentId = await agentService.getOrCreateDmAgent(
          ctx.from.id.toString(), // Telegram user ID
          ctx.chat.id.toString(), // Telegram chat ID
          ctx.from.username || `User_${ctx.from.id}`,
        );
        console.log(
          `🤖 Using agent: ${agentId} for user: ${ctx.from.username || ctx.from.id}`,
        );
      }

      // Construct MessagePayload from Telegraf context
      if (!ctx.message || !('text' in ctx.message) || !ctx.from || !ctx.chat) {
        console.error(
          '🛑 Error: Missing critical message, user, or chat information in context for processAndSendMessage.',
        );
        return;
      }
      const payload: LettaTypes.MessageCreate = {
        content: ctx.message.text,
        senderId: ctx.from.id.toString(),
        name: ctx.from.username || `User_${ctx.from.id}`,
        role: 'user',
      };
      const responseText = await sendMessage(payload, messageType, agentId);

      if (responseText !== '') {
        await ctx.reply(responseText);
        // Add bot's response to message history
        if (this.telegramSecrets.TELEGRAM_BOT_ID) {
          this.addMessageToHistory(
            ctx.chat.id.toString(),
            responseText,
            this.telegramSecrets.TELEGRAM_BOT_ID,
          );
        }
        console.log(`Message sent: ${responseText}`);
      }
    } catch (error: any) {
      console.error('🛑 Error Details for Telegram Bot:');
      console.error(
        '  Type:',
        error.constructor ? error.constructor.name : 'Unknown',
      );
      console.error('  Message:', error.message || 'No error message');
      if (error.response && error.response.description) {
        console.error('  Telegram Error:', error.response.description);
      }

      const errorMessage =
        '❌ Sorry, I encountered an error processing your request. Please try again later.';
      try {
        await ctx.reply(errorMessage);
        // Add error message to history as well
        if (this.telegramSecrets.TELEGRAM_BOT_ID && ctx.chat) {
          this.addMessageToHistory(
            ctx.chat.id.toString(),
            errorMessage,
            this.telegramSecrets.TELEGRAM_BOT_ID,
          );
        }
      } catch (replyError) {
        console.error('🛑 Failed to send error message to user:', replyError);
      }
    }
  }

  /**
   * Start a randomized event timer
   */
  public async startRandomEventTimer(): Promise<void> {
    if (!config.timer || !config.timer.enabled) {
      console.log('Timer feature is disabled for Telegram bot.');
      return;
    }
    if (!this.telegramSecrets.TELEGRAM_CHAT_ID_FOR_TIMER) {
      console.log(
        '⏰ Telegram chat ID for timer is not configured. Timer events will not be sent.',
      );
      return;
    }

    const minMinutes = 1;
    const randomMinutes =
      minMinutes +
      Math.floor(Math.random() * (config.timer.intervalMinutes - minMinutes));

    console.log(
      `⏰ Telegram Timer scheduled to fire in ${randomMinutes} minutes`,
    );

    const delay = randomMinutes * 60 * 1000;

    setTimeout(async () => {
      console.log(`⏰ Telegram Timer fired after ${randomMinutes} minutes`);

      if (Math.random() < config.timer.firingProbability) {
        console.log(
          `⏰ Telegram Random event triggered (${config.timer.firingProbability * 100}% chance)`,
        );

        const msg = await sendTimerMessage(this.agentId);

        if (msg !== '') {
          try {
            await this.bot.telegram.sendMessage(
              this.telegramSecrets.TELEGRAM_CHAT_ID_FOR_TIMER!,
              msg,
            );
            console.log(
              '⏰ Telegram Timer message sent to chat ID:',
              this.telegramSecrets.TELEGRAM_CHAT_ID_FOR_TIMER,
            );
          } catch (error) {
            console.error('⏰ Error sending Telegram timer message:', error);
          }
        }
      } else {
        console.log(
          `⏰ Telegram Random event not triggered (${(1 - config.timer.firingProbability) * 100}% chance)`,
        );
      }

      // Schedule the next timer
      // Add a small delay before rescheduling to prevent tight loops in case of immediate errors
      setTimeout(() => {
        this.startRandomEventTimer();
      }, 1000);
    }, delay);
  }

  /**
   * Send a direct message to a specific chat without handling responses
   * This is used by the manager for scheduled messages and other automated messages
   */
  public async sendDirectMessage(
    chatId: string,
    message: string,
  ): Promise<void> {
    if (!this.running) {
      throw new Error('Bot is not running - cannot send message');
    }

    if (!this.bot) {
      throw new Error('Bot instance is not initialized');
    }

    try {
      await this.bot.telegram.sendMessage(chatId, message);
    } catch (error) {
      console.error(
        `❌ Error sending direct message to chat ${chatId}:`,
        error,
      );
      throw error;
    }
  }

  public isRunning() {
    return this.running;
  }

  public async stop() {
    try {
      console.log('🛑 Stopping Telegram bot instance...');

      // Stop the Telegraf bot instance
      if (this.bot && this.running) {
        await this.bot.stop('SIGTERM');
        await this.bot.stop('SIGINT');
        console.log('✅ Telegraf bot stopped');
      }

      // Clear all state
      this.running = false;
      this.telegramTrigger = null;
      this.telegramSecrets = {};
      this.messageHistory.clear();

      // Create a new empty bot instance to prevent any lingering connections
      this.bot = new Telegraf('');

      // Add a small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('🤖 Telegram bot stopped and cleaned up');
    } catch (error) {
      console.warn('⚠️ Error stopping Telegram bot:', error);
      this.running = false;
      this.telegramTrigger = null;
      this.telegramSecrets = {};
      this.messageHistory.clear();
      this.bot = new Telegraf('');
    }
  }
}

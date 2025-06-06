import {
  Client,
  GatewayIntentBits,
  Partials,
  Message,
  Interaction,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { config } from '../config/index';
import { agentService } from './agent';
import {
  sendMessage,
  sendTimerMessage,
  MessageType,
  MessagePayload,
} from './message-service';

export class DiscordBot {
  private client: Client;
  private mainAgentId: string = '';

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the Discord bot(main agent ID)
   */
  public async initialize(mainAgentId: string): Promise<void> {
    this.mainAgentId = mainAgentId;
    await this.client.login(config.discord.token);
  }

  /**
   * Set up all Discord event handlers
   */
  private setupEventHandlers(): void {
    this.client.once('ready', this.handleReady.bind(this));
    this.client.on('messageCreate', this.handleMessageCreate.bind(this));
  }

  /**
   * Handle the ready event
   */
  private async handleReady(): Promise<void> {
    console.log(`🤖 Logged in as ${this.client.user?.tag}!`);

    // Register slash commands
    await this.registerSlashCommands();
  }

  /**
   * Register slash commands with Discord
   */
  private async registerSlashCommands(): Promise<void> {
    if (!config.discord.token || !config.discord.appId) {
      console.log(
        'No token or appId found; skipping slash command registration',
      );
      return;
    }
    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    try {
      await rest.put(Routes.applicationCommands(config.discord.appId), {
        body: [
          new SlashCommandBuilder()
            .setName('start_coaching')
            .setDescription('Start a private coaching session in DM')
            .toJSON(),
        ],
      });
      console.log('✅ Registered /start_coaching command');
    } catch (err) {
      console.error('Failed to register /start_coaching command:', err);
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleMessageCreate(message: Message): Promise<void> {
    // Check if the message is from a channel we're monitoring
    if (
      config.discord.channelId &&
      message.channel.id !== config.discord.channelId
    ) {
      console.log(
        `📩 Ignoring message from other channels (only listening on channel=${config.discord.channelId})...`,
      );
      return;
    }

    // Ignore messages from the bot itself
    if (message.author.id === this.client.user?.id) {
      console.log(`📩 Ignoring message from myself...`);
      return;
    }

    // Ignore messages from other bots if configured to do so
    if (message.author.bot && !config.discord.respondToBots) {
      console.log(`📩 Ignoring other bot...`);
      return;
    }

    // Handle test commands
    if (message.content.trim().toLowerCase() === '!testprogram') {
      console.log(`📩 Received test program command`);
      return;
    }

    // Ignore messages that start with !
    if (message.content.startsWith('!')) {
      console.log(`📩 Ignoring message that starts with !...`);
      return;
    }

    // Handle Direct Messages
    if (message.guild === null) {
      await this.handleDirectMessage(message);
      return;
    }

    // Handle mentions and replies
    if (
      config.discord.respondToMentions &&
      (message.mentions.has(this.client.user || '') || message.reference)
    ) {
      await this.handleMentionOrReply(message);
      return;
    }

    // Handle generic messages
    if (config.discord.respondToGeneric) {
      await this.handleGenericMessage(message);
      return;
    }
  }

  /**
   * Handle direct messages
   */
  private async handleDirectMessage(message: Message): Promise<void> {
    console.log(
      `📩 Received DM from ${message.author.username}: ${message.content}`,
    );
    if (config.discord.respondToDms) {
      await this.processAndSendMessage(message, MessageType.DM);
    } else {
      console.log(`📩 Ignoring DM...`);
    }
  }

  /**
   * Handle mentions and replies
   */
  private async handleMentionOrReply(message: Message): Promise<void> {
    console.log(
      `📩 Received message from ${message.author.username}: ${message.content}`,
    );

    try {
      if (message.channel && 'sendTyping' in message.channel) {
        await message.channel.sendTyping();
      }
    } catch (error) {
      // Ignore errors with sendTyping
      console.log('Could not send typing indicator');
    }

    // If it's a reply, fetch the original message
    if (message.reference && message.reference.messageId) {
      const originalMessage = await message.channel.messages.fetch(
        message.reference.messageId,
      );
      const truncatedContent = this.truncateMessage(
        originalMessage.content,
        config.messages.replyTruncateLength,
      );

      const finalContent = truncatedContent || originalMessage.content || ''; // Ensure it's always a string

      if (finalContent.trim() === '') {
        console.log('Skipping empty reply message after truncation.');
        return;
      }

      // Construct MessagePayload
      const payload: MessagePayload = {
        content: finalContent,
        senderId: message.author.id,
        senderName: message.author.username,
      };
      const agentToUse = this.mainAgentId;
      const msg = await sendMessage(payload, MessageType.REPLY, agentToUse);
      if (msg !== '') {
        await message.reply(msg);
      }
    } else {
      const Ccontent = message.content;
      if (Ccontent.trim() === '') {
        console.log('Skipping empty mention message.');
        return;
      }
      // Construct MessagePayload
      const payload: MessagePayload = {
        content: Ccontent,
        senderId: message.author.id,
        senderName: message.author.username,
      };
      const agentToUse = this.mainAgentId;
      const msg = await sendMessage(payload, MessageType.MENTION, agentToUse);
      if (msg !== '') {
        await message.reply(msg);
      }
    }
  }

  /**
   * Handle generic messages
   */
  private async handleGenericMessage(message: Message): Promise<void> {
    console.log(
      `📩 Received (non-mention) message from ${message.author.username}: ${message.content}`,
    );
    await this.processAndSendMessage(message, MessageType.GENERIC);
  }

  /**
   * Process a message and send a response
   */
  private async processAndSendMessage(
    message: Message,
    messageType: MessageType,
    existingAgentId?: string,
  ): Promise<void> {
    try {
      let agentId = existingAgentId || this.mainAgentId;

      // Handle agent creation/retrieval for DMs
      if (messageType === MessageType.DM) {
        agentId = await agentService.getOrCreateDmAgent(
          message.author.id,
          message.channel.id,
          message.author.username,
        );
        console.log(
          `🤖 Using agent: ${agentId} for user: ${message.author.username}`,
        );
      }

      // Construct MessagePayload
      if (!message.author || !message.channel) {
        console.error(
          '🛑 Error: Missing author or channel information in Discord message for processAndSendMessage.',
        );
        return;
      }
      const payload: MessagePayload = {
        content: message.content,
        senderId: message.author.id,
        senderName: message.author.username,
      };
      const agentToUse = agentId; // agentId is already string | undefined here from parameter
      const msg = await sendMessage(payload, messageType, agentToUse);
      if (msg !== '') {
        await message.reply(msg);
        console.log(`Message sent: ${msg}`);
      }

      if (message.content.trim() === '') {
        console.log('Skipping empty message in processAndSendMessage.');
        return;
      }
    } catch (error: any) {
      // Enhanced error handling
      console.error('🛑 Error Details:');
      console.error('  Type:', error.constructor.name);
      console.error('  Status:', error.statusCode || 'N/A');
      console.error('  Message:', error.message || 'No error message');

      // Send a user-friendly error message to Discord
      const errorMessage =
        '❌ Sorry, I encountered an error processing your request. Please try again later.';
      await message.reply(errorMessage);
    }
  }

  /**
   * Start a randomized event timer
   */
  public async startRandomEventTimer(): Promise<void> {
    if (!config.timer.enabled) {
      console.log('Timer feature is disabled.');
      return;
    }

    // Set a minimum delay to prevent too-frequent firing
    const minMinutes = 1;
    // Generate random minutes between minMinutes and TIMER_INTERVAL_MINUTES
    const randomMinutes =
      minMinutes +
      Math.floor(Math.random() * (config.timer.intervalMinutes - minMinutes));

    console.log(`⏰ Timer scheduled to fire in ${randomMinutes} minutes`);

    const delay = randomMinutes * 60 * 1000; // Convert minutes to milliseconds

    setTimeout(async () => {
      console.log(`⏰ Timer fired after ${randomMinutes} minutes`);

      // Determine if the event should fire based on the probability
      if (Math.random() < config.timer.firingProbability) {
        console.log(
          `⏰ Random event triggered (${config.timer.firingProbability * 100}% chance)`,
        );

        // Generate the response
        const msg = await sendTimerMessage(this.mainAgentId);

        // Pass that response to Discord
        if (msg !== '') {
          if (config.discord.channelId) {
            try {
              const channel = await this.client.channels.fetch(
                config.discord.channelId,
              );
              if (channel && 'send' in channel) {
                await channel.send(msg);
                console.log('⏰ Timer message sent to channel');
              } else {
                console.log('⏰ Channel not found or is not a text channel.');
              }
            } catch (error) {
              console.error('⏰ Error sending timer message:', error);
            }
          } else {
            console.log('⏰ No CHANNEL_ID defined; message not sent.');
          }
        }
      } else {
        console.log(
          `⏰ Random event not triggered (${(1 - config.timer.firingProbability) * 100}% chance)`,
        );
      }

      // Schedule the next timer with a small delay
      setTimeout(() => {
        this.startRandomEventTimer();
      }, 1000);
    }, delay);
  }

  /**
   * Helper function to retrieve recent conversation messages
   */
  private async getRecentMessages(
    channelId: string,
    userId: string,
    limit: number = 10,
  ): Promise<Message[]> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !('messages' in channel)) {
        return [];
      }

      // Get the recent messages
      const messages = await channel.messages.fetch({ limit });

      // Filter messages to only include the conversation between the user and the bot
      const conversationMessages = messages.filter(
        (msg) =>
          msg.author.id === userId || msg.author.id === this.client.user?.id,
      );

      // Sort messages by timestamp (oldest first)
      return Array.from(conversationMessages.values()).sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp,
      );
    } catch (error) {
      console.error('Error retrieving recent messages:', error);
      return [];
    }
  }

  /**
   * Helper function to truncate a message
   */
  private truncateMessage(message: string, maxLength: number): string {
    if (message.length > maxLength) {
      return message.substring(0, maxLength - 3) + '...'; // Truncate and add ellipsis
    }
    return message;
  }
}

export const discordBot = new DiscordBot();

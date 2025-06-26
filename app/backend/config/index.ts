import z from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load the base .env file for common variables
dotenvConfig();

// Load environment-specific .env file
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenvConfig({ path: resolve(process.cwd(), envFile) });

// Define Zod schema for environment variables
const envSchema = z.object({
  // Letta Configuration
  LETTA_TOKEN: z.string().min(1),
  LETTA_BASE_URL: z.string().url(),
  LETTA_AGENT_ID: z.string().optional(),
  LETTA_USE_SENDER_PREFIX: z
    .preprocess((val: unknown) => val === 'true', z.boolean())
    .default(true),

  // Discord Bot Configuration
  APP_ID: z.string().optional(),
  DISCORD_TOKEN: z.string().optional(),
  PUBLIC_KEY: z.string().optional(),
  DISCORD_CHANNEL_ID: z.string().optional(),
  DISCORD_SERVER_NAME: z.string().default('Bot Server'),
  DISCORD_ADMIN_NAME: z.string().default('adminname'),
  DISCORD_BOT_NAME: z.string().default('botname'),
  RESPOND_TO_DMS: z
    .preprocess((val: unknown) => val === 'true', z.boolean())
    .default(true),
  RESPOND_TO_MENTIONS: z
    .preprocess((val: unknown) => val === 'true', z.boolean())
    .default(true),
  RESPOND_TO_BOTS: z
    .preprocess((val: unknown) => val === 'true', z.boolean())
    .default(false),
  RESPOND_TO_GENERIC: z
    .preprocess((val: unknown) => val === 'true', z.boolean())
    .default(true),
  SURFACE_ERRORS: z
    .preprocess((val: unknown) => val === 'true', z.boolean())
    .default(false),

  // Timer Configuration
  ENABLE_TIMER: z
    .preprocess((val: unknown) => val === 'true', z.boolean())
    .default(true),
  TIMER_INTERVAL_MINUTES: z
    .preprocess(
      (val: unknown) => parseInt(String(val), 10),
      z.number().positive(),
    )
    .default(15),
  FIRING_PROBABILITY: z
    .preprocess(
      (val: unknown) => parseFloat(String(val)),
      z.number().min(0).max(1),
    )
    .default(0.1),
  PROGRAM_UPDATE_INTERVAL: z.enum(['daily', 'weekly']).default('daily'),

  // App Configuration
  PORT: z
    .preprocess(
      (val: unknown) => parseInt(String(val), 10),
      z.number().positive(),
    )
    .default(3000),
  CORS_ORIGIN: z.string().url().optional(),
  UPLOAD_MAX_JSON_SIZE: z
    .preprocess(
      (val: unknown) => parseInt(String(val), 10),
      z.number().positive(),
    )
    .default(1024 * 1024 * 10), // 10MB default limit

  // Webhook Configuration
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),

  // Data Source Configuration
  MAIN_DATA_SOURCE_NAME: z.string().optional(),
  MAIN_DATA_SOURCE_FILE_PATH: z.string().optional(),
  EMBEDDING_CONFIG: z.string().default('openai/text-embedding-3-small'),
  MODEL_CONFIG: z.string().default('openai/gpt-4o-mini'),

  // Message Configuration
  MESSAGE_REPLY_TRUNCATE_LENGTH: z
    .preprocess(
      (val: unknown) => parseInt(String(val), 10),
      z.number().positive(),
    )
    .default(100),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1),

  // Cryptopanic Configuration
  CRYPTOPANIC_API_KEY: z.string().min(1).optional(),
});

// Parse environment variables
const envVars = envSchema.safeParse(process.env);

// Handle validation errors
if (!envVars.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envVars.error.format());
  throw new Error('Invalid environment configuration');
}

// Export typed and validated config
export const config = {
  env: process.env.NODE_ENV,
  railway: {
    // see Railway defaults env
    envName: process.env.RAILWAY_ENVIRONMENT_NAME,
  },
  letta: {
    token: envVars.data.LETTA_TOKEN,
    baseUrl: envVars.data.LETTA_BASE_URL,
    agentId: envVars.data.LETTA_AGENT_ID || '',
    useSenderPrefix: envVars.data.LETTA_USE_SENDER_PREFIX,
  },
  discord: {
    appId: envVars.data.APP_ID,
    token: envVars.data.DISCORD_TOKEN,
    publicKey: envVars.data.PUBLIC_KEY,
    channelId: envVars.data.DISCORD_CHANNEL_ID,
    serverName: envVars.data.DISCORD_SERVER_NAME,
    adminName: envVars.data.DISCORD_ADMIN_NAME,
    botName: envVars.data.DISCORD_BOT_NAME,
    respondToDms: envVars.data.RESPOND_TO_DMS,
    respondToMentions: envVars.data.RESPOND_TO_MENTIONS,
    respondToBots: envVars.data.RESPOND_TO_BOTS,
    respondToGeneric: envVars.data.RESPOND_TO_GENERIC,
    surfaceErrors: envVars.data.SURFACE_ERRORS,
  },
  timer: {
    enabled: envVars.data.ENABLE_TIMER,
    intervalMinutes: envVars.data.TIMER_INTERVAL_MINUTES,
    firingProbability: envVars.data.FIRING_PROBABILITY,
    programUpdateInterval: envVars.data.PROGRAM_UPDATE_INTERVAL,
    devMode: process.env.TIMER_DEV_MODE === 'true',
  },
  app: {
    port: envVars.data.PORT,
    discordWebhookUrl: envVars.data.DISCORD_WEBHOOK_URL,
    slackWebhookUrl: envVars.data.SLACK_WEBHOOK_URL,
    corsOrigin: envVars.data.CORS_ORIGIN,
    uploadMaxJsonSize: envVars.data.UPLOAD_MAX_JSON_SIZE,
  },
  model: {
    modelConfig: envVars.data.MODEL_CONFIG,
    embeddingConfig: envVars.data.EMBEDDING_CONFIG,
  },
  dataSource: {
    mainDataSourceName: envVars.data.MAIN_DATA_SOURCE_NAME,
    mainDataSourceFilePath: envVars.data.MAIN_DATA_SOURCE_FILE_PATH,
  },
  messages: {
    replyTruncateLength: envVars.data.MESSAGE_REPLY_TRUNCATE_LENGTH,
  },
  openai: {
    apiKey: envVars.data.OPENAI_API_KEY,
  },
  cryptopanic: {
    apiKey: envVars.data.CRYPTOPANIC_API_KEY,
  },
};

export default config;

import { GenericTrigger } from '../../database/db';
import { getUserSecret } from '../../database/db';
import { openaiService } from '../openai';

export type TriggerContext = {
  message?: string;
  messageType?: string;
  history?: string[];
  env?: Record<string, string>;
  [key: string]: any;
};

/**
 * Evaluate if the bot should answer based on user-defined prompt instruction
 * @param trigger - The trigger configuration
 * @param context - The context including the message
 * @returns Promise<boolean> - true if should answer, false otherwise
 */
export async function evaluateShouldAnswerRule(
  trigger: GenericTrigger,
  context: TriggerContext,
): Promise<boolean> {
  const shouldAnswerConfig = trigger.config.shouldAnswer;

  // If no shouldAnswer config or disabled, default to answering
  if (!shouldAnswerConfig || !shouldAnswerConfig.enabled) {
    return true;
  }

  // If no user instruction provided, default to answering
  if (
    !shouldAnswerConfig.instruction ||
    !shouldAnswerConfig.instruction.trim()
  ) {
    return true;
  }

  // If no message in context, default to answering
  if (!context.message) {
    return true;
  }

  try {
    // Create prompt for LLM to evaluate
    const prompt = `You are evaluating whether a bot should respond to a message based on user-defined rules.

User instruction: "${shouldAnswerConfig.instruction}"

Message to evaluate: "${context.message}"

Based on the user instruction above, should the bot respond to this message?
Respond with only "true" or "false" (no explanation).`;

    const response = await openaiService.createTextCompletion(
      prompt,
      'gpt-4o-mini',
    );

    // Parse the response
    const shouldAnswer = response.trim().toLowerCase() === 'true';
    return shouldAnswer;
  } catch (error) {
    console.error('Error evaluating shouldAnswer rule:', error);
    // On error, default to answering to avoid blocking legitimate messages
    return true;
  }
}

/**
 * Resolve secrets from trigger config using user_secrets table
 * @param trigger - The trigger configuration
 * @param userId - The user ID to fetch secrets for
 * @returns Record<string, string> - Decrypted secrets
 */
export function resolveTriggerSecrets(
  trigger: GenericTrigger,
  userId: string,
): Record<string, string> {
  const secrets: Record<string, string> = {};

  // trigger.config.secrets is an object with secret names as both key and value
  // Example: { secrets: { "TELEGRAM_BOT_TOKEN": "TELEGRAM_BOT_TOKEN", "OPENAI_API_KEY": "OPENAI_API_KEY" } }
  if (trigger.config.secrets && typeof trigger.config.secrets === 'object') {
    for (const [secretKey, secretName] of Object.entries(
      trigger.config.secrets,
    )) {
      try {
        const secretValue = getUserSecret(userId, secretKey);
        if (secretValue) {
          // Use the secret key (original name) as the key in the result
          secrets[secretKey] = secretValue;
        }
      } catch (error) {
        console.error(`Error resolving secret ${secretName}:`, error);
        // Skip this secret if resolution fails
      }
    }
  }

  return secrets;
}

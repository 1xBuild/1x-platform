import { Request, Response } from 'express';
import {
  setUserSecret,
  deleteUserSecret,
  listUserSecretKeys,
  getBotsByAgentId,
  upsertBot,
  getUserSecret,
} from '../database/db';

// New endpoint to manage secrets
export const getUserSecretsController = (req: Request, res: Response) => {
  const userId = req.query.userId || req.params.userId || req.body.userId;
  if (!userId) {
    res.status(400).json({ success: false, error: 'userId is required' });
    return;
  }

  // TODO: CRITICAL SECURITY - Add user authentication/authorization
  // Currently anyone can list any user's secret keys!
  // Need to verify that the requesting user owns the userId

  try {
    const secretKeys = listUserSecretKeys(userId as string);
    res.json({ success: true, secrets: secretKeys });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to get user secrets',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

export const resolveSecretsController = (req: Request, res: Response) => {
  const { userId, key } = req.body;
  if (!userId || !key) {
    res.status(400).json({
      success: false,
      error: 'userId, key, and value are required',
    });
    return;
  }

  try {
    // TODO: CRITICAL SECURITY - Add user authentication/authorization
    // Currently anyone can resolve any user's secrets!
    // Need to verify that the requesting user owns the userId

    const secretValue = getUserSecret(userId, key);
    if (secretValue) {
      res.json({ success: true, secret: secretValue });
    } else {
      res.status(404).json({ success: false, error: 'Secret not found' });
    }
  } catch (error) {
    console.error(`Error resolving secret ${key}:`, error);
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to resolve secret',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

export const setUserSecretController = (req: Request, res: Response) => {
  const { userId, key, value } = req.body;
  if (!userId || !key || !value) {
    res.status(400).json({
      success: false,
      error: 'userId, key, and value are required',
    });
    return;
  }

  // TODO: CRITICAL SECURITY - Add user authentication/authorization
  // Currently anyone can set secrets for any user!
  // Need to verify that the requesting user owns the userId

  try {
    setUserSecret(userId, key, value);
    res.json({ success: true });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to set user secret',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

export const deleteUserSecretController = (req: Request, res: Response) => {
  const { userId, key } = req.body;
  if (!userId || !key) {
    res.status(400).json({
      success: false,
      error: 'userId and key are required',
    });
    return;
  }

  // TODO: CRITICAL SECURITY - Add user authentication/authorization
  // Currently anyone can delete any user's secrets!
  // Need to verify that the requesting user owns the userId

  try {
    deleteUserSecret(userId, key);

    // Check if this was a required secret and disable relevant bots
    const requiredSecretsByBotType: Record<string, string[]> = {
      telegram: ['TELEGRAM_BOT_TOKEN'],
      discord: ['DISCORD_BOT_TOKEN'],
    };

    for (const [botType, requiredSecrets] of Object.entries(
      requiredSecretsByBotType,
    )) {
      if (requiredSecrets.includes(key)) {
        // This was a required secret for this bot type, disable the bot
        const bot = getBotsByAgentId(userId).find((b) => b.type === botType);
        if (bot && bot.status === 'running') {
          upsertBot({
            agent_id: userId,
            type: botType,
            status: 'stopped',
            last_stopped: new Date().toISOString(),
            error_message: `Bot disabled due to missing required secret: ${key}`,
          });
        }
      }
    }

    res.json({ success: true });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to delete user secret',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

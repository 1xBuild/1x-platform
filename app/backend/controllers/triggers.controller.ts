import { Request, Response } from 'express';
import {
  getTriggersByAgentId,
  getTriggerById,
  upsertTrigger,
  deleteTrigger,
  listAllTriggers,
  setUserSecret,
} from '../database/db';
import { telegramBotManager } from '../services/telegram-bot-manager';
import { scheduledTriggerManager } from '../services/triggers/scheduled-trigger';

// List all triggers for an agent
export const getTriggersByAgent = (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;
  if (!agentId) {
    res.status(400).json({ success: false, error: 'agentId is required' });
    return;
  }
  try {
    const triggers = getTriggersByAgentId(agentId as string);
    res.json({ success: true, triggers });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to get triggers',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

// Get a single trigger by id
export const getTrigger = (req: Request, res: Response) => {
  const { id } = req.params || req.body;
  if (!id) {
    res
      .status(400)
      .json({ status: 'error', code: 400, message: 'id is required' });
    return;
  }
  try {
    const trigger = getTriggerById(id);
    if (!trigger) {
      res
        .status(404)
        .json({ status: 'error', code: 404, message: 'Trigger not found' });
      return;
    }
    res.json({ status: 'success', trigger });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to get trigger',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

// Create or update a trigger (upsert)
export const upsertTriggerController = async (req: Request, res: Response) => {
  const { id, agent_id, type, enabled, config, secrets } = req.body;
  if (
    !agent_id ||
    !type ||
    typeof enabled !== 'boolean' ||
    typeof config !== 'object'
  ) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields (agent_id, type, enabled, config)',
    });
    return;
  }

  // We can have only one telegram bot per agent
  if (type === 'telegram') {
    const agentTriggers = getTriggersByAgentId(agent_id);
    const alreadyHasTelegramTriggers = agentTriggers.filter(
      (trigger) => trigger.type === 'telegram' && trigger.id !== id,
    );

    if (alreadyHasTelegramTriggers.length > 0) {
      res.status(400).json({
        success: false,
        error: 'We can have only one Telegram bot per agent',
      });
      return;
    }
  }

  // Validate scheduled trigger config
  if (type === 'scheduled') {
    const { schedule, message } = config;
    if (!schedule || !message) {
      res.status(400).json({
        success: false,
        error: 'Scheduled triggers require schedule and message in config',
      });
      return;
    }

    // Validate cron expression
    const cron = await import('node-cron');
    if (!cron.validate(schedule)) {
      res.status(400).json({
        success: false,
        error: `Invalid cron expression: ${schedule}`,
      });
      return;
    }
  }

  try {
    // Handle secrets if provided
    // TODO: CRITICAL SECURITY - Add user authentication/authorization
    // Currently any agent can access any user's secrets!
    // Need to verify that the requesting user owns the agent_id
    if (secrets && typeof secrets === 'object') {
      for (const [secretKey, secretValue] of Object.entries(secrets)) {
        if (typeof secretValue === 'string' && secretValue.trim()) {
          setUserSecret(agent_id, secretKey, secretValue);
        }
      }
    }

    const triggerId = await upsertTrigger({
      id,
      agent_id,
      type,
      enabled,
      config,
    });

    // Get the updated trigger
    const trigger = getTriggerById(triggerId);
    if (!trigger) {
      res.status(500).json({
        status: 'error',
        code: 500,
        message: 'Failed to retrieve created/updated trigger',
      });
      return;
    }

    // Start/stop bots based on trigger state
    if (type === 'telegram') {
      if (enabled) {
        const result = await telegramBotManager.start(agent_id);

        if (result.success) {
          console.log(
            `✅ Successfully started Telegram bot for agent ${agent_id}`,
          );
        } else {
          console.warn(
            `❌ Failed to start Telegram bot for agent ${agent_id}: ${result.error}`,
          );
          trigger.enabled = false;
          upsertTrigger(trigger);
          res.status(500).json({
            status: 'error',
            code: 500,
            message:
              'Failed to start Telegram bot, verify that your bot bot token is correct',
            details: result.error,
          });
          return;
        }
      } else {
        try {
          await telegramBotManager.stop(agent_id);
          console.log(
            `✅ Successfully stopped Telegram bot for agent ${agent_id}`,
          );
        } catch (error) {
          console.error(
            `❌ Error stopping Telegram bot for agent ${agent_id}:`,
            error,
          );
        }
      }
    }

    // Handle scheduled triggers
    if (type === 'scheduled') {
      if (enabled) {
        try {
          await scheduledTriggerManager.addScheduledTrigger(trigger);
          console.log(
            `✅ Successfully added scheduled trigger for agent ${agent_id}`,
          );
        } catch (error) {
          console.error(
            `❌ Failed to add scheduled trigger for agent ${agent_id}:`,
            error,
          );
          res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Failed to schedule trigger',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
          return;
        }
      } else {
        scheduledTriggerManager.removeScheduledTrigger(triggerId);
        console.log(
          `✅ Disabled Trigger: Successfully removed the scheduled trigger for agent ${agent_id}`,
        );
      }
    }

    res.json({ success: true, trigger });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to upsert trigger',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

// Delete a trigger by id
export const deleteTriggerController = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ success: false, error: 'id is required' });
    return;
  }
  try {
    // Get trigger before deletion to know its type
    const trigger = getTriggerById(id);

    // Delete from database
    deleteTrigger(id);

    // Handle cleanup based on trigger type
    if (trigger?.type === 'scheduled') {
      scheduledTriggerManager.removeScheduledTrigger(id);
      console.log(`✅ Successfully removed scheduled trigger ${id}`);
    } else if (trigger?.type === 'telegram') {
      try {
        await telegramBotManager.stop(trigger.agent_id);
        console.log(
          `✅ Successfully stopped Telegram bot for agent ${trigger.agent_id}`,
        );
      } catch (error) {
        console.error(
          `❌ Error stopping Telegram bot for agent ${trigger.agent_id}:`,
          error,
        );
      }
    }

    res.json({ success: true });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to delete trigger',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

// List all triggers (admin/debug)
export const getAllTriggers = (req: Request, res: Response) => {
  try {
    const triggers = listAllTriggers();
    res.json({ success: true, triggers });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to get all triggers',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

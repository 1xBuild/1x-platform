import { Request, Response } from 'express';
import { telegramBotManager } from '../services/telegram-bot-manager';
import {
  getScheduledTriggerByAgentId,
  upsertScheduledTrigger,
  listAllScheduledTriggers,
} from '../database/db';

export const enableTelegram = async (req: Request, res: Response) => {
  const { enabled, agentId } = req.body;
  try {
    if (enabled) {
      console.log(
        `[TelegramBotManager] Activation requested for agentId: ${agentId}`,
      );
      await telegramBotManager.start(agentId);
      res.json({ success: true, enabled: true });
    } else {
      console.log(
        `[TelegramBotManager] Deactivation requested for agentId: ${agentId}`,
      );
      telegramBotManager.stop(agentId);
      res.json({ success: true, enabled: false });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to enable telegram',
      details: err instanceof Error ? err.message : String(err),
    });
  }
};

export const getTelegramStatus = async (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;

  if (!agentId) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: 'agentId is required',
    });
    return;
  }

  try {
    console.log(`[TelegramBotManager] Checking status for agentId: ${agentId}`);
    const isRunning = await telegramBotManager.isRunning(agentId);
    res.json({
      enabled: isRunning,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: 'Failed to get telegram status', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getScheduleTrigger = (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;

  if (!agentId) {
    res.status(400).json({ success: false, error: 'agentId is required' });
  }

  try {
    const trigger = getScheduledTriggerByAgentId(agentId as string);
    res.json({ success: true, trigger });
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: 'Failed to get scheduled trigger', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const upsertScheduleTrigger = (req: Request, res: Response) => {
  const { agentId, enabled, hour, minute, message, id } = req.body;

  if (!agentId || typeof hour !== 'number' || typeof minute !== 'number' || typeof message !== 'string') {
    res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  upsertScheduledTrigger({
    id,
    agent_id: agentId,
    enabled: !!enabled,
    hour,
    minute,
    message,
  });

  const trigger = getScheduledTriggerByAgentId(agentId);

  try {
    res.json({ success: true, trigger });
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: 'Failed to get scheduled trigger', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getAllScheduleTriggers = (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;
  if (!agentId) {
    res.status(400).json({ success: false, error: 'agentId is required' });
  }
  try {
    const triggers = listAllScheduledTriggers().filter(t => t.agent_id === agentId);
    res.json({ success: true, triggers });
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: 'Failed to get all scheduled triggers', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const deleteScheduleTrigger = (req: Request, res: Response) => {
  const { id, agentId } = req.body;
  if (!id || !agentId) {
    res.status(400).json({ success: false, error: 'id and agentId are required' });
  }
  const db = require('../database/db').default;
  try {
    db.prepare('DELETE FROM scheduled_triggers WHERE id = ? AND agent_id = ?').run(id, agentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: 'Failed to delete scheduled trigger', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

import { Request, Response } from 'express';
import { agentService } from '../services/agent';
import { agentSchema, agentCreateSchema } from '../middlewares/agent.schema';
import { IApiErrorResponse } from '../types';

export const agentController = {
  list: async (_req: Request, res: Response): Promise<void> => {
    try {
      const agents = await agentService.list();
      res.json(agents);
    } catch (error) {
      const errorResponse: IApiErrorResponse = {
        status: 'error',
        code: error.code,
        message: error.message,
      };
      res.status(error.code).json(errorResponse);
    }
  },

  get: async (req: Request, res: Response): Promise<void> => {
    const agent = await agentService.get(req.params.id);
    if (!agent) {
      const error: IApiErrorResponse = {
        status: 'error',
        code: 404,
        message: 'Agent not found',
      };
      res.status(404).json(error);
      return;
    }
    res.json(agent);
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const parse = agentCreateSchema.safeParse(req.body);
    if (!parse.success) {
      const error: IApiErrorResponse = {
        status: 'error',
        code: 400,
        message: 'Validation error',
        details: parse.error.format(),
      };
      res.status(400).json(error);
      return;
    }
    const agent = await agentService.create(parse.data);
    res.status(201).json(agent);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const parse = agentSchema.safeParse(req.body);
    if (!parse.success) {
      const error: IApiErrorResponse = {
        status: 'error',
        code: 400,
        message: 'Validation error',
        details: parse.error.format(),
      };
      res.status(400).json(error);
      return;
    }

    try {
      const existing = await agentService.get(req.params.id);
      if (!existing) {
        const error: IApiErrorResponse = {
          status: 'error',
          code: 404,
          message: 'Agent not found',
        };
        res.status(404).json(error);
        return;
      }
      await agentService.update(parse.data);
      res.json(parse.data);
    } catch (error) {
      const errorResponse: IApiErrorResponse = {
        status: 'error',
        code: error.code,
        message: error.message,
      };
      res.status(error.code).json(errorResponse);
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    const existing = await agentService.get(req.params.id);
    if (!existing) {
      const error: IApiErrorResponse = {
        status: 'error',
        code: 404,
        message: 'Agent not found',
      };
      res.status(404).json(error);
      return;
    }
    await agentService.delete(req.params.id, existing.details.name);
    res.status(204).send();
  },
};

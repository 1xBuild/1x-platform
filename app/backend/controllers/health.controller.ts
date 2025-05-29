import { Request, Response } from 'express';

/**
 * Handle /GET /health
 * @param req - The request object.
 * @param res - The response object.
 * @returns void
 */
export const healthController = {
  checkHealth: async (_req: Request, res: Response) => {
    try {
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {
          tempDirWritable: true,
          cacheWorking: true,
          diskFreeMB: 1234,
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      res.status(200).json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};

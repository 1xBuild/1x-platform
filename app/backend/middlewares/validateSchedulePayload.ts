import { Request, Response, NextFunction } from 'express';

export function validateSchedulePayload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { enabled, agentId } = req.body;

  if (typeof enabled !== 'boolean') {
    res.status(400).json({
      success: false,
      error: '`enabled` must be a boolean.',
    });
    return;
  }

  if (typeof agentId !== 'string' || agentId.trim() === '') {
    res.status(400).json({
      success: false,
      error: '`agentId` must be a non-empty string.',
    });
    return;
  }

  next();
}

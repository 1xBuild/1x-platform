import { Request, Response, NextFunction } from 'express';

/**
 * Ensures the request is authenticated.
 * Expects a previous auth layer (e.g. JWT, session) to have populated `req.user`.
 * Responds with HTTP 401 when authentication information is missing or malformed.
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || typeof req.user.id !== 'string' || req.user.id.trim() === '') {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
};

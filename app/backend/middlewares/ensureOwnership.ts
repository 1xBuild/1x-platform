import { Request, Response, NextFunction } from 'express';

/**
 * Verifies that the `userId` carried in the request (query, params or body)
 * matches the authenticated user.
 * If no `userId` is present, the middleware delegates validation to the controller.
 */
export const ensureOwnership = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authUserId = req.user?.id;

  // `requireAuth` should have guaranteed this
  if (!authUserId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const targetUserId =
    (req.body?.userId as string | undefined) ||
    (req.query?.userId as string | undefined) ||
    (req.params?.userId as string | undefined);

  if (targetUserId && targetUserId !== authUserId) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  next();
};

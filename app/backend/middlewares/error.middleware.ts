import { Request, Response } from 'express';
import { config } from '../config/index';

/**
 * Global error handler
 * @param err - The error object
 * @param req - The request object
 * @param res - The response object
 */
export function errorHandler(err: any, _req: Request, res: Response) {
  if (config.env !== 'test') {
    console.error('Unhandled error: ', err);
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: err.message || 'Internal Server Error',
    ...(err.details && { details: err.details }),
  });
}

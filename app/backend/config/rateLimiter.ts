import rateLimit from 'express-rate-limit';

export const createApiLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  max: 100, // limit to 100 requests per IP
  standardHeaders: true, // return RateLimit-* headers
  legacyHeaders: false, // disable X-RateLimit-* headers
  message: {
    code: 429,
    message: 'Too many requests - please try again later',
  },
});

import { type NextFunction, type Request, type Response } from 'express';

import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const userId = (req as any)?.user?.userId;
    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration_ms: durationMs,
        userId: typeof userId === 'number' ? userId : undefined,
      },
      'HTTP request',
    );
  });

  next();
};


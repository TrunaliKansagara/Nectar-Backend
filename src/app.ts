import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';

import { MESSAGES } from './constants/messages';
import { STATUS_CODES } from './constants/statusCodes';
import { errorMiddleware } from './middleware/errorMiddleware';
import { requestLogger } from './middleware/requestLogger';
import { routes } from './routes';
import { AppError } from './utils/appError';
import { sendSuccess } from './utils/responseHandler';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.get('/health', (_req: Request, res: Response) => {
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.HEALTH_OK);
  });

  app.use(routes);

  app.use((_req: Request, _res: Response) => {
    throw new AppError(STATUS_CODES.NOT_FOUND, MESSAGES.ROUTE_NOT_FOUND);
  });

  app.use(errorMiddleware);

  return app;
};

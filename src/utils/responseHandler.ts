import { type Response } from 'express';

export type ApiResponse<TData = unknown> = {
  success: boolean;
  message: string;
  data?: TData;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: unknown;
};

export const sendSuccess = <TData>(
  res: Response,
  statusCode: number,
  message: string,
  data?: TData,
  pagination?: ApiResponse['pagination'],
) => {
  const payload: ApiResponse<TData> = {
    success: true,
    message,
    ...(data === undefined ? {} : { data }),
    ...(pagination === undefined ? {} : { pagination }),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (res: Response, statusCode: number, message: string, error?: unknown) => {
  const payload: ApiResponse = {
    success: false,
    message,
    ...(error === undefined ? {} : { error }),
  };
  return res.status(statusCode).json(payload);
};

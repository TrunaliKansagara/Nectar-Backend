import { type Response } from 'express';

export type ApiResponse<TData = unknown> = {
  success: boolean;
  message: string;
  data?: TData;
  error?: unknown;
};

export const sendSuccess = <TData>(
  res: Response,
  statusCode: number,
  message: string,
  data?: TData,
) => {
  const payload: ApiResponse<TData> = {
    success: true,
    message,
    ...(data === undefined ? {} : { data }),
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

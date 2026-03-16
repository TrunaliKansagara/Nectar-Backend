import { type Response } from 'express';

export type ApiResponse<TData = unknown> = {
  success: boolean;
  message: string;
  data?: TData;
  errors?: unknown;
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

export const sendError = (res: Response, statusCode: number, message: string, errors?: unknown) => {
  const payload: ApiResponse = {
    success: false,
    message,
    ...(errors === undefined ? {} : { errors }),
  };
  return res.status(statusCode).json(payload);
};

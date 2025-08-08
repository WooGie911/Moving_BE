import { Request, Response, NextFunction } from "express";
import { CustomError } from "../types/error.types";
import * as Sentry from "@sentry/node";

/**
 * 전역 에러 핸들링 미들웨어
 */
export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // 센트리로 에러 전송
  Sentry.captureException(err, {
    extra: {
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user,
    },
    tags: {
      error_type: err.name || "UnknownError",
      status_code: err.status || err.statusCode || 500,
    },
  });

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message:
        process.env.NODE_ENV === "production"
          ? statusCode === 500
            ? "내부 서버 오류가 발생했습니다."
            : err.message
          : err.message,
      status: statusCode,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 에러 핸들링 미들웨어
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  // 404 에러를 CustomError로 변환하여 전역 에러 핸들러로 전달
  const notFoundError = new Error(`페이지를 찾을 수 없습니다.: ${req.method} ${req.originalUrl}`) as CustomError;
  notFoundError.status = 404;
  notFoundError.statusCode = 404;

  next(notFoundError);
};

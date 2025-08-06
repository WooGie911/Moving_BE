import { Request, Response, NextFunction } from "express";
import { CustomError } from "../types/error.types";
import * as Sentry from "@sentry/node";

/**
 * 전역 에러 핸들링 미들웨어 (Express 전역 에러 처리용)
 *
 * Express 앱에서 발생하는 모든 예외를 처리하며,
 * Sentry로 에러를 추적하고 일관된 에러 응답을 제공합니다.
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
 * 404 에러 핸들링 미들웨어 (라우트를 찾을 수 없는 경우)
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `페이지를 찾을 수 없습니다.: ${req.method} ${req.originalUrl}`,
      status: 404,
    },
    timestamp: new Date().toISOString(),
  });
};

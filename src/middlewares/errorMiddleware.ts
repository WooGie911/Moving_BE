import { Request, Response, NextFunction } from "express";
import { CustomError } from "../types/error.types";

/**
 * 전역 에러 핸들링 미들웨어
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
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
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `페이지를 찾을 수 없습니다.: ${req.method} ${req.originalUrl}`,
      status: 404,
    },
    timestamp: new Date().toISOString(),
  });
};

import { ErrorCode } from "../types/errors.types";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  layer: string;
  code?: ErrorCode;
  message: string;
  userId?: string;
  requestId?: string;
  originalError?: unknown;
}

class Logger {
  private formatLog(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level}] [${entry.layer}] ${entry.code ? `[${entry.code}] ` : ""}${entry.message}${entry.userId ? ` (사용자: ${entry.userId})` : ""}`;
  }

  info(message: string, layer: string, userId?: string, requestId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      layer,
      message,
      userId,
      requestId,
    };
    console.log(this.formatLog(entry));
  }

  warn(message: string, layer: string, userId?: string, requestId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      layer,
      message,
      userId,
      requestId,
    };
    console.warn(this.formatLog(entry));
  }

  error(
    message: string,
    layer: string,
    code?: ErrorCode,
    originalError?: unknown,
    userId?: string,
    requestId?: string
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      layer,
      code,
      message,
      userId,
      requestId,
      originalError,
    };

    console.error(this.formatLog(entry));

    // 개발 환경에서는 스택 트레이스도 출력
    if (process.env.NODE_ENV === "development" && originalError) {
      console.error("Original Error:", originalError);
    }
  }
}

export const logger = new Logger();

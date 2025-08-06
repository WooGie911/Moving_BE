import { Response } from "express";
import {
  AuthenticationError,
  DatabaseError,
  ServerError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
} from "../types/commonError.types";
import * as Sentry from "@sentry/node";

/**
 * 공통 에러 핸들러 (컨트롤러 내부 에러 처리용)
 *
 * @param res - Express Response 인스턴스
 * @param error - 발생한 에러 객체
 * @param fallbackMessage - 예상치 못한 에러의 기본 메시지
 * @param sentryContext - Sentry 추적을 위한 추가 컨텍스트 (선택사항)
 */
export const handleError = (
  res: Response,
  error: any,
  fallbackMessage: string = "예상치 못한 오류가 발생했습니다.",
  sentryContext?: {
    extra?: Record<string, any>;
    tags?: Record<string, string>;
  },
) => {
  let status = 500;
  let message = fallbackMessage;

  switch (error.constructor) {
    case AuthenticationError:
      status = 401;
      message = error.message;
      break;

    case ForbiddenError:
      status = 403;
      message = error.message;
      break;

    case NotFoundError:
      status = 404;
      message = error.message;
      break;

    case ValidationError:
      status = 422;
      message = error.message;
      break;

    case TooManyRequestsError:
      status = 429;
      message = error.message;
      break;

    case DatabaseError:
    case ServerError:
      status = 500;
      message = error.message;
      break;

    case Error:
      message = error.message;
      break;

    default:
      // 그대로 fallback 유지
      break;
  }

  // Sentry 추적 (컨텍스트가 제공된 경우)
  if (sentryContext) {
    Sentry.captureException(error, {
      extra: sentryContext.extra,
      tags: sentryContext.tags,
    });
  }

  res.status(status).json({
    success: false,
    message,
  });
};

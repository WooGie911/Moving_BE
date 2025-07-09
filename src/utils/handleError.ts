import { Response } from "express";
import {
  AuthenticationError,
  DatabaseError,
  ServerError,
  ValidationError,
} from "../types/commonError";

/**
 * 공통 에러 핸들러
 *
 * @param res - Express Response 인스턴스
 * @param error - 발생한 에러 객체
 * @param fallbackMessage - 예상치 못한 에러의 기본 메시지
 */
export const handleError = (
  res: Response,
  error: any,
  fallbackMessage: string = "예상치 못한 오류가 발생했습니다."
) => {
  let status = 500;
  let message = fallbackMessage;

  switch (error.constructor) {
    case AuthenticationError:
      status = 401;
      message = error.message;
      break;

    case ValidationError:
      status = 422;
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

  res.status(status).json({
    status,
    message,
  });
};

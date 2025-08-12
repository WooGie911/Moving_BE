import rateLimit from "express-rate-limit";
import { handleError } from "../utils/handleError";
import { TooManyRequestsError } from "../types/commonError.types";

// 로그인 요청 제한: 1분간 최대 10회
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    handleError(
      res,
      new TooManyRequestsError(
        "로그인 요청이 너무 많습니다. 1분 후 다시 시도해주세요."
      )
    );
  },
});

// 테스트를 위해 1분으로 설정, 텍스트는 30분으로 보냄 (원래는 30분 정도)
// 회원가입 요청 제한: 1분간 최대 5회
export const signupLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    handleError(
      res,
      new TooManyRequestsError(
        "회원가입 요청이 너무 많습니다. 30분 후 다시 시도해주세요."
      )
    );
  },
});

// 견적요청 제한: 1시간동안 최대 5회
export const estimateRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    handleError(
      res,
      new TooManyRequestsError(
        "견적요청이 너무 많습니다. 1시간 후 다시 시도해주세요."
      )
    );
  },
});

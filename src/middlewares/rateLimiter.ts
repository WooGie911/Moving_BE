import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../types/commonError.types";

// 로그인 요청 제한: 1분간 최대 10회
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "로그인 요청이 너무 많습니다. 1분 후 다시 시도해주세요.",
    });
  },
});

// 회원가입 요청 제한: 30분간 최대 5회
export const signupLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30분
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "회원가입 요청이 너무 많습니다. 30분 후 다시 시도해주세요.",
    });
  },
});

// 견적요청 제한: 1시간동안 최대 5회
export const estimateRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "견적요청이 너무 많습니다. 1시간 후 다시 시도해주세요.",
    });
  },
});

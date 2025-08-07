import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// CSRF 토큰 저장소 (실제 프로덕션에서는 Redis 등을 사용)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// CSRF 토큰 생성 함수
const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// CSRF 토큰 검증 함수
const validateToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;

  // 토큰 만료 확인
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
};

// 세션 ID 생성 함수
const getSessionId = (req: Request): string => {
  // JWT 토큰에서 사용자 ID를 세션 ID로 사용
  const userId = (req.user as any)?.userId;
  return userId || req.ip || "anonymous";
};

// CSRF 토큰 생성 미들웨어
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req);
    const token = generateToken();
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24시간

    // 토큰 저장
    csrfTokens.set(sessionId, { token, expires });

    // 응답 헤더에 CSRF 토큰 추가
    res.setHeader("X-CSRF-Token", token);

    // 쿠키에도 토큰 설정
    res.cookie("XSRF-TOKEN", token, {
      httpOnly: false, // 프론트엔드에서 접근 가능하도록
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    });

    next();
  } catch (error) {
    console.error("CSRF 토큰 생성 실패:", error);
    res.status(500).json({
      success: false,
      message: "CSRF 토큰 생성 중 오류가 발생했습니다.",
    });
  }
};

// CSRF 검증 미들웨어
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req);
    const token = (req.headers["x-csrf-token"] as string) || req.cookies["XSRF-TOKEN"];

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "CSRF 토큰이 없습니다.",
      });
    }

    if (!validateToken(sessionId, token)) {
      return res.status(403).json({
        success: false,
        message: "CSRF 토큰이 유효하지 않습니다. 페이지를 새로고침해주세요.",
      });
    }

    next();
  } catch (error) {
    console.error("CSRF 검증 중 오류:", error);
    res.status(500).json({
      success: false,
      message: "CSRF 검증 중 오류가 발생했습니다.",
    });
  }
};

// CSRF 토큰 조회 API
export const getCSRFToken = (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const token = generateToken();
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24시간

    // 토큰 저장
    csrfTokens.set(sessionId, { token, expires });

    // 쿠키에도 토큰 설정
    res.cookie("XSRF-TOKEN", token, {
      httpOnly: false, // 프론트엔드에서 접근 가능하도록
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    });

    res.json({
      success: true,
      message: "CSRF 토큰이 생성되었습니다.",
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("CSRF 토큰 조회 실패:", error);
    res.status(500).json({
      success: false,
      message: "CSRF 토큰 조회 중 오류가 발생했습니다.",
    });
  }
};

// 만료된 토큰 정리 함수 (스케줄러에서 호출)
export const cleanupExpiredTokens = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expires) {
      csrfTokens.delete(sessionId);
      cleanedCount++;
    }
  }

  console.log(`🧹 CSRF 토큰 정리 완료: ${cleanedCount}개 만료된 토큰 삭제`);
  return cleanedCount;
};

// 토큰 저장소 상태 조회 함수
export const getCSRFTokenStats = () => {
  return {
    totalTokens: csrfTokens.size,
    activeTokens: Array.from(csrfTokens.values()).filter((data) => Date.now() <= data.expires).length,
    expiredTokens: Array.from(csrfTokens.values()).filter((data) => Date.now() > data.expires).length,
  };
};

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import redisClient from "../config/redis";

// CSRF 토큰 키 접두사
const CSRF_TOKEN_PREFIX = "csrf:";

// CSRF 토큰 생성 함수
const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Redis에 CSRF 토큰 저장
const storeToken = async (token: string, expires: number): Promise<void> => {
  try {
    const key = `${CSRF_TOKEN_PREFIX}${token}`;
    const expiresInSeconds = Math.floor((expires - Date.now()) / 1000);

    await redisClient.setEx(key, expiresInSeconds, JSON.stringify({ token, expires }));
  } catch (error) {
    console.error("Redis 토큰 저장 실패:", error);
    throw error;
  }
};

// Redis에서 CSRF 토큰 조회
const getStoredToken = async (token: string): Promise<{ token: string; expires: number } | null> => {
  try {
    const key = `${CSRF_TOKEN_PREFIX}${token}`;
    const data = await redisClient.get(key);

    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error("Redis 토큰 조회 실패:", error);
    return null;
  }
};

// Redis에서 CSRF 토큰 삭제
const deleteToken = async (token: string): Promise<void> => {
  try {
    const key = `${CSRF_TOKEN_PREFIX}${token}`;
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis 토큰 삭제 실패:", error);
  }
};

// CSRF 토큰 검증 함수
const validateToken = async (token: string): Promise<boolean> => {
  try {
    const stored = await getStoredToken(token);
    if (!stored) return false;

    // 토큰 만료 확인
    if (Date.now() > stored.expires) {
      await deleteToken(token);
      return false;
    }

    return stored.token === token;
  } catch (error) {
    console.error("토큰 검증 실패:", error);
    return false;
  }
};

// CSRF 토큰 생성 미들웨어
export const generateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = generateToken();
    const expires = Date.now() + 15 * 60 * 1000; // 15분

    // Redis에 토큰 저장
    await storeToken(token, expires);

    // 응답 헤더에 CSRF 토큰 추가
    res.setHeader("X-CSRF-Token", token);

    // 쿠키에도 토큰 설정 (CORS 호환성을 위해 수정)
    const cookieOptions: any = {
      httpOnly: false, // 프론트엔드에서 접근 가능하도록
      maxAge: 15 * 60 * 1000, // 15분
    };

    // 프로덕션 환경에서만 추가 설정
    if (process.env.NODE_ENV === "production") {
      cookieOptions.secure = true; // HTTPS에서만 전송
      cookieOptions.sameSite = "none"; // CORS 호환성
      cookieOptions.domain = ".gomoving.site"; // 서브도메인 공유
    } else {
      cookieOptions.sameSite = "lax"; // 개발환경
    }

    res.cookie("XSRF-TOKEN", token, cookieOptions);

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
export const validateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req.headers["x-csrf-token"] as string) || req.cookies["XSRF-TOKEN"];

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "CSRF 토큰이 없습니다.",
      });
    }

    const isValid = await validateToken(token);
    if (!isValid) {
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
export const getCSRFToken = async (req: Request, res: Response) => {
  try {
    const token = generateToken();
    const expires = Date.now() + 15 * 60 * 1000; // 15분

    // Redis에 토큰 저장
    await storeToken(token, expires);

    // 쿠키에도 토큰 설정 (CORS 호환성을 위해 수정)
    const cookieOptions: any = {
      httpOnly: false, // 프론트엔드에서 접근 가능하도록
      maxAge: 15 * 60 * 1000, // 15분
    };

    // 프로덕션 환경에서만 추가 설정
    if (process.env.NODE_ENV === "production") {
      cookieOptions.secure = true; // HTTPS에서만 전송
      cookieOptions.sameSite = "none"; // CORS 호환성
      cookieOptions.domain = ".gomoving.site"; // 서브도메인 공유
    } else {
      cookieOptions.sameSite = "lax"; // 개발환경
    }

    res.cookie("XSRF-TOKEN", token, cookieOptions);

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
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    // Redis는 자동으로 만료된 키를 삭제하므로 별도 정리 로직이 필요하지 않음
    console.log("🧹 Redis는 자동으로 만료된 CSRF 토큰을 정리합니다.");
    return 0;
  } catch (error) {
    console.error("CSRF 토큰 정리 실패:", error);
    return 0;
  }
};

// 토큰 저장소 상태 조회 함수
export const getCSRFTokenStats = async () => {
  try {
    // Redis에서 CSRF 토큰 패턴으로 키 개수 조회
    const pattern = `${CSRF_TOKEN_PREFIX}*`;
    const keys = await redisClient.keys(pattern);

    return {
      totalTokens: keys.length,
      activeTokens: keys.length, // Redis는 자동으로 만료된 키를 삭제하므로 모든 키가 활성 상태
      expiredTokens: 0, // Redis가 자동으로 처리
    };
  } catch (error) {
    console.error("CSRF 토큰 통계 조회 실패:", error);
    return {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
    };
  }
};

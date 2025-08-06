import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import Redis from "ioredis";
import * as Sentry from "@sentry/node";

// 폴백용 메모리 저장소
const fallbackTokens = new Map<string, { token: string; expires: number }>();
let useFallback = false;
let redis: Redis | null = null;

// Redis 연결 시도 함수
const initializeRedis = () => {
  // 개발 환경에서는 Redis 사용 여부를 환경변수로 제어
  const useRedis = process.env.USE_REDIS === "true";

  if (!useRedis) {
    console.log("🔧 개발 모드: 메모리 기반 CSRF 토큰 저장소 사용");
    useFallback = true;
    return;
  }

  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    });

    redis.on("connect", () => {
      console.log("✅ Redis 연결 성공");
      useFallback = false;
    });

    redis.on("error", (error: Error) => {
      console.error("❌ Redis 연결 오류:", error);
      console.log("⚠️ 메모리 기반 폴백 모드로 전환합니다.");

      // Sentry에 Redis 연결 오류 추적
      Sentry.captureException(error, {
        tags: {
          component: "csrf-middleware",
          error_type: "redis_connection_error",
        },
        extra: {
          redisHost: process.env.REDIS_HOST || "localhost",
          redisPort: process.env.REDIS_PORT || "6379",
          useFallback: true,
        },
      });

      useFallback = true;
      // 연결 실패 시 Redis 인스턴스 정리
      if (redis) {
        redis.disconnect();
        redis = null;
      }
    });

    // 초기 연결 시도 (한 번만)
    redis.connect().catch((error) => {
      console.log("⚠️ Redis 초기 연결 실패, 메모리 기반 폴백 모드로 전환합니다.");

      // Sentry에 Redis 초기 연결 실패 추적
      Sentry.captureException(error, {
        tags: {
          component: "csrf-middleware",
          error_type: "redis_initial_connection_failed",
        },
        extra: {
          redisHost: process.env.REDIS_HOST || "localhost",
          redisPort: process.env.REDIS_PORT || "6379",
          useFallback: true,
        },
      });

      useFallback = true;
      if (redis) {
        redis.disconnect();
        redis = null;
      }
    });
  } catch (error) {
    console.error("❌ Redis 초기화 실패:", error);

    // Sentry에 Redis 초기화 실패 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "redis_initialization_failed",
      },
      extra: {
        redisHost: process.env.REDIS_HOST || "localhost",
        redisPort: process.env.REDIS_PORT || "6379",
        useFallback: true,
      },
    });

    useFallback = true;
  }
};

// Redis 초기화
initializeRedis();

// CSRF 토큰 생성 함수
const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// CSRF 토큰 검증 함수
const validateToken = async (sessionId: string, token: string): Promise<boolean> => {
  try {
    if (useFallback) {
      // 메모리 기반 폴백
      const stored = fallbackTokens.get(sessionId);
      if (!stored) return false;

      // 토큰 만료 확인
      if (Date.now() > stored.expires) {
        fallbackTokens.delete(sessionId);
        return false;
      }

      return stored.token === token;
    } else {
      // Redis 기반
      if (!redis) {
        console.log("⚠️ Redis 연결이 없어 메모리 기반으로 처리합니다.");
        return false;
      }

      const storedToken = await redis.get(`csrf:${sessionId}`);
      if (!storedToken) return false;

      // 토큰 만료 확인 (Redis TTL 사용)
      const ttl = await redis.ttl(`csrf:${sessionId}`);
      if (ttl <= 0) {
        await redis.del(`csrf:${sessionId}`);
        return false;
      }

      return storedToken === token;
    }
  } catch (error) {
    console.error("토큰 검증 오류:", error);

    // Sentry에 토큰 검증 오류 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "token_validation_error",
      },
      extra: {
        sessionId,
        useFallback,
        hasRedis: !!redis,
      },
    });

    return false;
  }
};

// 세션 ID 생성 함수
const getSessionId = (req: Request): string => {
  // 인증된 사용자만 userId 사용
  if (req.user && (req.user as any)?.userId) {
    return (req.user as any).userId;
  }

  // 인증되지 않은 사용자는 IP 주소 사용
  return req.ip || "anonymous";
};

// CSRF 토큰 생성 미들웨어
export const generateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 인증되지 않은 사용자는 CSRF 토큰 생성 건너뛰기
    if (!req.user) {
      return next();
    }

    const sessionId = getSessionId(req);
    const token = generateToken();
    const expiresIn = 24 * 60 * 60; // 24시간 (초 단위)

    if (useFallback || !redis) {
      // 메모리 기반 폴백
      const expires = Date.now() + 24 * 60 * 60 * 1000; // 24시간
      fallbackTokens.set(sessionId, { token, expires });
    } else {
      // Redis에 토큰 저장 (TTL 설정)
      await redis.setex(`csrf:${sessionId}`, expiresIn, token);
    }

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

    // Sentry에 CSRF 토큰 생성 오류 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "csrf_token_generation_error",
      },
      extra: {
        sessionId: getSessionId(req),
        useFallback,
        hasRedis: !!redis,
      },
    });

    res.status(500).json({
      success: false,
      message: "CSRF 토큰 생성 중 오류가 발생했습니다.",
    });
  }
};

// CSRF 검증 미들웨어
export const validateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req);
    const token = (req.headers["x-csrf-token"] as string) || req.cookies["XSRF-TOKEN"];

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "CSRF 토큰이 없습니다.",
      });
    }

    const isValid = await validateToken(sessionId, token);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        message: "CSRF 토큰이 유효하지 않습니다. 페이지를 새로고침해주세요.",
      });
    }

    next();
  } catch (error) {
    console.error("CSRF 검증 중 오류:", error);

    // Sentry에 CSRF 검증 오류 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "csrf_validation_error",
      },
      extra: {
        sessionId: getSessionId(req),
        useFallback,
        hasRedis: !!redis,
      },
    });

    res.status(500).json({
      success: false,
      message: "CSRF 검증 중 오류가 발생했습니다.",
    });
  }
};

// CSRF 토큰 조회 API
export const getCSRFToken = async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const token = generateToken();
    const expiresIn = 24 * 60 * 60; // 24시간 (초 단위)

    if (useFallback || !redis) {
      // 메모리 기반 폴백
      const expires = Date.now() + 24 * 60 * 60 * 1000; // 24시간
      fallbackTokens.set(sessionId, { token, expires });
    } else {
      // Redis에 토큰 저장 (TTL 설정)
      await redis.setex(`csrf:${sessionId}`, expiresIn, token);
    }

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

    // Sentry에 CSRF 토큰 조회 오류 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "csrf_token_fetch_error",
      },
      extra: {
        sessionId: getSessionId(req),
        useFallback,
        hasRedis: !!redis,
      },
    });

    res.status(500).json({
      success: false,
      message: "CSRF 토큰 조회 중 오류가 발생했습니다.",
    });
  }
};

// 만료된 토큰 정리 함수
export const cleanupExpiredTokens = async () => {
  try {
    if (useFallback) {
      // 메모리 기반 폴백 정리
      const now = Date.now();
      let cleanedCount = 0;

      for (const [sessionId, data] of fallbackTokens.entries()) {
        if (now > data.expires) {
          fallbackTokens.delete(sessionId);
          cleanedCount++;
        }
      }

      console.log(`🧹 메모리 기반 CSRF 토큰 정리 완료: ${cleanedCount}개 만료된 토큰 삭제`);
      return cleanedCount;
    } else {
      // Redis는 자동으로 만료된 키를 삭제하므로 별도 정리 불필요
      console.log("🧹 Redis는 자동으로 만료된 CSRF 토큰을 관리합니다.");
      return 0;
    }
  } catch (error) {
    console.error("CSRF 토큰 정리 중 오류:", error);

    // Sentry에 CSRF 토큰 정리 오류 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "csrf_token_cleanup_error",
      },
      extra: {
        useFallback,
        hasRedis: !!redis,
      },
    });

    return 0;
  }
};

// 토큰 저장소 상태 조회 함수
export const getCSRFTokenStats = async () => {
  try {
    if (useFallback) {
      // 메모리 기반 폴백 통계
      const now = Date.now();
      const totalTokens = fallbackTokens.size;
      const activeTokens = Array.from(fallbackTokens.values()).filter((data) => now <= data.expires).length;
      const expiredTokens = totalTokens - activeTokens;

      return {
        totalTokens,
        activeTokens,
        expiredTokens,
        mode: "memory-fallback",
      };
    } else {
      // Redis 기반 통계
      if (!redis) {
        return {
          totalTokens: 0,
          activeTokens: 0,
          expiredTokens: 0,
          mode: "redis-unavailable",
        };
      }

      const keys = await redis.keys("csrf:*");
      const totalTokens = keys.length;

      let activeTokens = 0;
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl > 0) {
          activeTokens++;
        }
      }

      return {
        totalTokens,
        activeTokens,
        expiredTokens: totalTokens - activeTokens,
        mode: "redis",
      };
    }
  } catch (error) {
    console.error("CSRF 토큰 통계 조회 실패:", error);

    // Sentry에 CSRF 토큰 통계 조회 오류 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "csrf_token_stats_error",
      },
      extra: {
        useFallback,
        hasRedis: !!redis,
      },
    });

    return {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      mode: "error",
    };
  }
};

// Redis 연결 종료 함수
export const closeRedisConnection = async () => {
  try {
    if (!useFallback && redis) {
      await redis.quit();
      console.log("✅ Redis 연결 종료 완료");
    }
  } catch (error) {
    console.error("❌ Redis 연결 종료 실패:", error);

    // Sentry에 Redis 연결 종료 오류 추적
    Sentry.captureException(error, {
      tags: {
        component: "csrf-middleware",
        error_type: "redis_connection_close_error",
      },
      extra: {
        useFallback,
        hasRedis: !!redis,
      },
    });
  }
};

// 통합 보안 미들웨어 (인증 + CSRF 검증)
export const secureRoute = [validateCSRFToken];

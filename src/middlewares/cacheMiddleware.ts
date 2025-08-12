import { Request, Response, NextFunction } from "express";
import { buildCacheKey, redisGet, redisSetEx, redisDel, redisDeleteByPattern } from "../utils/redisClient";

export type CacheKeyBuilder = (req: Request) => string;

export interface CacheOptions {
  ttlSeconds?: number;
  keyBuilder?: CacheKeyBuilder;
  varyByAuth?: boolean; // include userId when authenticated
}

const DEFAULT_TTL = 60; // 1 minute default

export function cache(options: CacheOptions = {}) {
  const ttl = options.ttlSeconds ?? DEFAULT_TTL;
  const keyBuilder = options.keyBuilder;
  const varyByAuth = options.varyByAuth ?? true;

  return async function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
    // Only cache idempotent GET
    if (req.method !== "GET") return next();

    const authPart = varyByAuth && (req as any).user?.userId ? `u:${(req as any).user.userId}` : "anon";

    const cacheKey = keyBuilder
      ? keyBuilder(req)
      : buildCacheKey(["cache", req.method, req.baseUrl, req.path, authPart, req.originalUrl.split("?")[1] ?? ""]);

    try {
      const cached = await redisGet(cacheKey);
      if (cached) {
        console.log("cache hit");
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Key", cacheKey);
        return res.status(200).type("application/json").send(cached);
      }
    } catch {
      // cache read failure -> fallthrough
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      try {
        const payload = typeof body === "string" ? body : JSON.stringify(body);
        void redisSetEx(cacheKey, ttl, payload);
        console.log("cache miss");
        res.setHeader("X-Cache", "MISS");
        res.setHeader("Cache-Key", cacheKey);
      } catch {
        // ignore
      }
      return originalJson(body);
    };

    next();
  };
}

// Helper to invalidate by composing same key parts
export async function invalidateCacheByKey(keyParts: Array<string | number | undefined | null>): Promise<void> {
  const key = buildCacheKey(keyParts);
  await redisDel(key);
}

export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  await redisDeleteByPattern(pattern);
}

// 리뷰 관련 캐시 무효화를 위한 전용 함수
export async function invalidateReviewCaches(customerId: string, moverId: string): Promise<void> {
  const patterns = [
    // 고객이 작성한 리뷰 캐시 무효화
    `cache:GET:reviews:customer:${customerId}:*`,
    // 이사업체가 받은 리뷰 캐시 무효화
    `cache:GET:reviews:mover:${moverId}:*`,
    // 리뷰 작성 가능 목록 캐시 무효화 (모든 사용자)
    "cache:GET:reviews:writable-estimateRequests:*",
    // 기사님 상세 정보 캐시 무효화 (리뷰 통계가 업데이트되므로)
    `cache:GET:/movers:/${moverId}:*`,
    // 기사님 목록 캐시 무효화 (평점이 변경되므로)
    "cache:GET:/movers:*"
  ];

  try {
    await Promise.all(patterns.map(pattern => invalidateCacheByPattern(pattern)));
    console.log(`[Cache] 리뷰 관련 캐시 무효화 완료 - customerId: ${customerId}, moverId: ${moverId}`);
  } catch (error) {
    console.error('[Cache] 리뷰 관련 캐시 무효화 실패:', error);
  }
}

import { cache, invalidateCacheByKey, invalidateCacheByPattern } from "./cacheMiddleware";

jest.mock("../utils/redisClient", () => {
  return {
    __esModule: true,
    buildCacheKey: jest.fn((parts: Array<string | number | undefined | null>) => parts.join(":")),
    redisGet: jest.fn(),
    redisSetEx: jest.fn(),
    redisDel: jest.fn(),
    redisDeleteByPattern: jest.fn(),
  };
});

const redis = require("../utils/redisClient");

function buildReqRes(method: string, userId?: string) {
  const req: any = {
    method,
    baseUrl: "/api",
    path: "/items",
    originalUrl: "/api/items?q=1",
    user: userId ? { userId } : undefined,
  };
  const res: any = {
    status: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("cacheMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("non-GET 요청은 바로 next() 호출", async () => {
    const { req, res, next } = buildReqRes("POST");
    const mw = cache();
    await mw(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
    expect(redis.redisGet).not.toHaveBeenCalled();
  });

  it("cache hit 시 200과 캐시헤더, body 반환", async () => {
    const { req, res, next } = buildReqRes("GET", "u1");
    (redis.redisGet as jest.Mock).mockResolvedValue("CACHED");
    const mw = cache();
    await mw(req as any, res as any, next);
    expect(res.setHeader).toHaveBeenCalledWith("X-Cache", "HIT");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("CACHED");
    expect(next).not.toHaveBeenCalled();
  });

  it("cache miss 시 next() 후 res.json 호출 시 저장 및 MISS 헤더 세팅", async () => {
    const { req, res, next } = buildReqRes("GET", "u1");
    (redis.redisGet as jest.Mock).mockResolvedValue(null);
    const mw = cache();
    await mw(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
    // 라우트 핸들러가 응답을 보낸 상황을 시뮬레이션
    const payload = { ok: true };
    res.json(payload);
    expect(redis.redisSetEx).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("X-Cache", "MISS");
  });

  it("varyByAuth=false 일 때 캐시키에 anon 포함", async () => {
    const { req, res, next } = buildReqRes("GET", "u99");
    (redis.redisGet as jest.Mock).mockResolvedValue(null);
    const mw = cache({ varyByAuth: false });
    await mw(req as any, res as any, next);
    res.json({ ok: true });
    // 마지막으로 세팅된 헤더에서 anon 포함 확인
    const calls = res.setHeader.mock.calls.filter((c: any[]) => c[0] === "Cache-Key");
    const lastKey = calls[calls.length - 1]?.[1];
    expect(String(lastKey)).toContain("anon");
  });
});

describe("cache invalidation helpers", () => {
  it("invalidateCacheByKey는 redisDel을 호출", async () => {
    await invalidateCacheByKey(["a", "b", 1]);
    expect(redis.redisDel).toHaveBeenCalled();
  });

  it("invalidateCacheByPattern은 redisDeleteByPattern을 호출", async () => {
    await invalidateCacheByPattern("cache:*");
    expect(redis.redisDeleteByPattern).toHaveBeenCalledWith("cache:*");
  });
});

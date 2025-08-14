import Redis, { Redis as RedisClient } from "ioredis";

let redisClientInstance: RedisClient | null = null;

function createRedisClient(): RedisClient {
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = Number(process.env.REDIS_PORT ?? "6379");
  const password = process.env.REDIS_PASSWORD;
  const useTls = (process.env.REDIS_TLS ?? "false").toLowerCase() === "true";

  const client = new Redis({
    host,
    port,
    password,
    tls: useTls ? {} : undefined,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 2000),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  client.on("connect", () => {
    // eslint-disable-next-line no-console
    console.log("[Redis] connected");
  });

  client.on("reconnecting", () => {
    // eslint-disable-next-line no-console
    console.log("[Redis] reconnecting...");
  });

  return client;
}

export async function getRedisClient(): Promise<RedisClient> {
  if (!redisClientInstance) {
    redisClientInstance = createRedisClient();
  }
  if (redisClientInstance.status !== "ready") {
    try {
      await redisClientInstance.connect();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[Redis] connect failed; continuing without cache", e);
    }
  }
  return redisClientInstance;
}

export async function redisGet(key: string): Promise<string | null> {
  const client = await getRedisClient();
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function redisSetEx(key: string, ttlSeconds: number, value: string): Promise<void> {
  const client = await getRedisClient();
  try {
    await client.set(key, value, "EX", ttlSeconds);
  } catch {
    // ignore cache write failures
  }
}

export async function redisDel(key: string): Promise<void> {
  const client = await getRedisClient();
  try {
    await client.del(key);
  } catch {
    // ignore
  }
}

export function buildCacheKey(parts: Array<string | number | undefined | null>): string {
  return parts
    .filter((p) => p !== undefined && p !== null && String(p).length > 0)
    .map((p) => String(p))
    .join(":");
}

export async function redisDeleteByPattern(pattern: string): Promise<void> {
  const client = await getRedisClient();
  try {
    let cursor = "0";
    do {
      const result = (await client.scan(cursor, "MATCH", pattern, "COUNT", 100)) as [string, string[]];
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // ignore
  }
}

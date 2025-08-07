import { createClient } from "redis";

// Redis 클라이언트 생성
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Redis 연결 재시도 횟수 초과");
        return new Error("Redis 연결 실패");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Redis 연결 이벤트 핸들러
redisClient.on("connect", () => {
  console.log("✅ Redis 서버에 연결되었습니다.");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis 연결 오류:", err);
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis 재연결 시도 중...");
});

// Redis 연결 함수
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("Redis 연결 실패:", error);
    throw error;
  }
};

// Redis 클라이언트 내보내기
export default redisClient;

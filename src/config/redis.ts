import Redis from "ioredis";

// Redis 클라이언트 생성
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  connectTimeout: 10000, // 연결 시도 타임아웃 (10초)
  maxRetriesPerRequest: 10, // 요청당 최대 재시도 횟수
  lazyConnect: false, // 즉시 연결 - 서버 시작 시 바로 연결
  reconnectOnError: (err) => {
    // 특정 에러 발생 시 자동 재연결 여부 결정
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true; // READONLY 에러 시 재연결
    }
    return false; // 다른 에러는 재연결하지 않음
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

redisClient.on("ready", () => {
  console.log("🚀 Redis 클라이언트가 준비되었습니다.");
});

// Redis 연결 함수
export const connectRedis = async () => {
  try {
    // ioredis는 자동으로 연결되므로 연결 상태만 확인
    if (redisClient.status === "ready") {
      return redisClient;
    }

    // 연결이 준비될 때까지 대기
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Redis 연결 시간 초과"));
      }, 5000); // 타임아웃을 5초로 단축

      if (redisClient.status === "ready") {
        clearTimeout(timeout);
        resolve(redisClient);
        return;
      }

      redisClient.once("ready", () => {
        clearTimeout(timeout);
        resolve(redisClient);
      });

      redisClient.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    return redisClient;
  } catch (error) {
    console.error("Redis 연결 실패:", error);
    throw error;
  }
};

// Redis 클라이언트 내보내기
export default redisClient;

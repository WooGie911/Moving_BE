import { PrismaClient } from "@prisma/client";
import { reviewPrismaMiddleware } from "../../middlewares/reviewMiddleware";
import { notificationMiddleware } from "../../middlewares/notificationMiddleware";

// Singleton 패턴으로 Prisma 클라이언트 인스턴스를 관리하여 연결 풀 최적화
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // 프로덕션 환경에서의 연결 풀 최적화 설정
    // log: ["query", "info", "warn", "error"], // 필요시 로그 활성화
  });
} else {
  // 개발 환경에서 HMR 시 연결이 누적되지 않도록 global 변수 사용
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient({
      // log: ["query", "info", "warn", "error"], // 개발 시 디버깅용
    });
  }
  prisma = (global as any).prisma;
}

// 테스트 환경에서는 Prisma 미들웨어를 비활성화하여 부작용/노이즈를 방지
if (process.env.NODE_ENV !== "test") {
  // 리뷰생성 Prisma 미들웨어 등록
  prisma.$use(reviewPrismaMiddleware);

  // 알림생성 Prisma 미들웨어 등록
  prisma.$use(notificationMiddleware);
}

export default prisma;

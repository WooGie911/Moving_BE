import * as cron from "node-cron";
import expirationService from "../services/expiration.service";

// 스케줄러 설정
const initializeScheduler = () => {
  console.log("🕒 스케줄러 초기화 중...");

  // 매 10분마다 만료된 견적 요청 처리
  cron.schedule(
    "*/30 * * * *",
    async () => {
      console.log("⏰ [30분 스케줄러] 만료된 견적 요청 처리 시작");
      try {
        await expirationService.processExpiredEstimateRequests();
      } catch (error) {
        console.error("❌ [30분 스케줄러] 만료된 견적 요청 처리 실패:", error);
      }
    },
    {
      timezone: "Asia/Seoul", // 한국 시간 기준
    }
  );

  // 개발 환경에서는 매 5분마다 실행 (테스트용)
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 개발 환경: 5분마다 만료 처리 스케줄러 실행");
    cron.schedule(
      "*/2 * * * *",
      async () => {
        console.log("⏰ [개발 스케줄러] 만료된 견적 요청 처리 시작");
        try {
          await expirationService.processExpiredEstimateRequests();
        } catch (error) {
          console.error(
            "❌ [개발 스케줄러] 만료된 견적 요청 처리 실패:",
            error
          );
        }
      },
      {
        timezone: "Asia/Seoul",
      }
    );
  }

  console.log("✅ 스케줄러 초기화 완료");
  console.log("📅 매 30분마다 만료된 견적 요청 처리가 실행됩니다.");
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 개발 환경: 2분마다 추가 실행됩니다.");
  }
};

export { initializeScheduler };

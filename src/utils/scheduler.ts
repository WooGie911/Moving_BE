import * as cron from "node-cron";
import expirationService from "../services/expiration.service";

// 스케줄러 설정
const initializeScheduler = () => {
  console.log("🕒 스케줄러 초기화 중...");

  // 매일 00시에 만료된 견적 요청 처리 (PENDING → EXPIRED)
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("⏰ [일일 스케줄러] 만료된 견적 요청 처리 시작");
      console.log("📋 PENDING 상태인 견적 요청의 이사일과 서버 시간을 비교하여 만료 처리");
      try {
        const result = await expirationService.processExpiredEstimateRequests();
        if (result) {
          console.log(
            `✅ [일일 스케줄러] 처리 완료: ${result.processedRequests}개 견적 요청 만료, ${result.orphanedEstimates}개 orphaned 견적 정리`,
          );
        } else {
          console.log("ℹ️ [일일 스케줄러] 처리할 만료된 견적 요청이 없습니다.");
        }
      } catch (error) {
        console.error("❌ [일일 스케줄러] 만료된 견적 요청 처리 실패:", error);
      }
    },
    {
      timezone: "Asia/Seoul", // 한국 시간 기준
    },
  );

  console.log("✅ 스케줄러 초기화 완료");
  console.log("📅 매일 00시에 만료된 견적 요청 처리가 실행됩니다.");
  console.log("🔄 PENDING → EXPIRED: 이사일이 지난 견적 요청을 만료 처리");
  console.log("🔄 PROPOSED → AUTO_REJECTED: 만료된 견적 요청의 제안 견적들을 자동 거절");
};

export { initializeScheduler };

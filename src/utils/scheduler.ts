import * as cron from "node-cron";
import expirationService from "../services/expiration.service";
import actionService from "../services/action.service";
import { ActionType } from "@prisma/client";
import estimateRequestRepository from "../repositories/estimateRequest.repository";
import reviewRepository from "../repositories/review.repository";

// 이사일 알림 생성 함수
const generateMoveDayReminders = async () => {
  console.log("이사일 알림 생성 시작");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 내일 이사 예정인 견적 요청들 조회
  const tomorrowRequests =
    await estimateRequestRepository.getEstimateRequestsForMoveDayReminders(
      tomorrow
    );

  // 오늘 이사 예정인 견적 요청들 조회
  const todayRequests =
    await estimateRequestRepository.getEstimateRequestsForMoveDayReminders(
      today
    );

  let createdCount = 0;

  // 내일 이사 알림 생성
  for (const request of tomorrowRequests) {
    for (const estimate of request.estimates) {
      await actionService.createAction(
        estimate.moverId,
        ActionType.MOVE_DAY_REMINDER_TOMORROW,
        estimate.id,
        "DESIGNATED_ESTIMATE",
        { moveType: request.moveType, estimateId: request.id }
      );

      await actionService.createAction(
        request.customerId,
        ActionType.MOVE_DAY_REMINDER_TOMORROW,
        estimate.id,
        "DESIGNATED_ESTIMATE",
        { moveType: request.moveType, estimateId: request.id }
      );

      createdCount += 2;
    }
  }

  // 오늘 이사 알림 생성
  for (const request of todayRequests) {
    for (const estimate of request.estimates) {
      await actionService.createAction(
        estimate.moverId,
        ActionType.MOVE_DAY_REMINDER_TODAY,
        estimate.id,
        "DESIGNATED_ESTIMATE",
        { moveType: request.moveType, estimateId: request.id }
      );

      await actionService.createAction(
        request.customerId,
        ActionType.MOVE_DAY_REMINDER_TODAY,
        estimate.id,
        "DESIGNATED_ESTIMATE",
        { moveType: request.moveType, estimateId: request.id }
      );

      createdCount += 2;
    }
  }

  console.log(`이사일 알림 생성 완료: ${createdCount}개 알림 생성`);
};

// 리뷰 요청 생성 함수
const generateMoveDayReviewRequests = async () => {
  console.log("리뷰 요청 생성 시작");

  // 이사 날짜가 지났으면서 COMPLETED 상태인 견적 요청들 조회
  const completedRequests =
    await estimateRequestRepository.getEstimateRequestsForReviewRequests();

  for (const request of completedRequests) {
    // 리뷰 조회 (견적 요청당 하나의 리뷰만 존재)
    const review = await reviewRepository.getReview(request.id);

    if (review) {
      await actionService.createAction(
        request.customerId,
        ActionType.MOVE_DAY_REVIEW_REQUEST,
        review.id,
        "REVIEW",
        { moverName: review.mover?.nickname || "" }
      );
    }
  }

  console.log("리뷰 요청 생성 완료");
};

// 스케줄러 설정
const initializeScheduler = () => {
  console.log("🕒 스케줄러 초기화 중...");

  // 매일 00시에 만료된 견적 요청 처리 (PENDING → EXPIRED)
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("⏰ [일일 스케줄러] 만료된 견적 요청 처리 시작");
      console.log(
        "📋 PENDING 상태인 견적 요청의 이사일과 서버 시간을 비교하여 만료 처리"
      );
      try {
        const result = await expirationService.processExpiredEstimateRequests();
        if (result) {
          console.log(
            `✅ [일일 스케줄러] 처리 완료: ${result.processedRequests}개 견적 요청 만료, ${result.orphanedEstimates}개 orphaned 견적 정리`
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
    }
  );

  // 매일 09시에 이사일 알림 및 리뷰 요청 생성
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("⏰ [일일 스케줄러] 이사일 알림 및 리뷰 요청 생성 시작");
      try {
        await generateMoveDayReminders();
        await generateMoveDayReviewRequests();
        console.log("[일일 스케줄러] 이사일 알림 및 리뷰 요청 생성 완료");
      } catch (error) {
        console.error(
          "[일일 스케줄러] 이사일 알림 및 리뷰 요청 생성 실패:",
          error
        );
      }
    },
    {
      timezone: "Asia/Seoul", // 한국 시간 기준
    }
  );

  console.log("✅ 스케줄러 초기화 완료");
  console.log("📅 매일 00시에 만료된 견적 요청 처리가 실행됩니다.");
  console.log("📅 매일 09시에 이사일 알림 및 리뷰 요청이 생성됩니다.");
  console.log("🔄 PENDING → EXPIRED: 이사일이 지난 견적 요청을 만료 처리");
  console.log(
    "🔄 PROPOSED → AUTO_REJECTED: 만료된 견적 요청의 제안 견적들을 자동 거절"
  );
  console.log("🔄 이사일 알림: 내일/오늘 이사 예정인 고객과 기사님에게 알림");
  console.log(
    "🔄 리뷰 요청: 이사 날짜가 지났으면서 COMPLETED 상태인 고객에게 리뷰 요청"
  );
};

export {
  initializeScheduler,
  generateMoveDayReminders,
  generateMoveDayReviewRequests,
};

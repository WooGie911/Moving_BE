import { Router } from "express";
import moverEstimateController from "../controllers/moverEstimate.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();

// 모든 라우트에 토큰 검증 미들웨어 적용
router.use(verifyAccessToken);

// 1. 견적 생성
router.post("/create", moverEstimateController.createEstimate);

// 2. 견적 반려
router.post("/reject", moverEstimateController.rejectEstimate);

// 3. 서비스 가능 지역 견적 조회
router.get("/region", moverEstimateController.getRegionQuote);

// 4. 지정 견적 조회
router.get("/designated", moverEstimateController.getDesignatedQuote);

// 5. 지역/지정 견적 통합 조회
router.get("/list", moverEstimateController.getAllQuotes);

// 6. 견적 상세 조회
router.get("/quote/:quoteId", moverEstimateController.getQuoteById);

// 7. 내가 보낸 견적서 조회
router.get("/my-estimates", moverEstimateController.getMyEstimate);

// 8. 내가 반려한 견적 조회
router.get("/my-rejected", moverEstimateController.getMyRejectedQuotes);

// 9. 견적 상태 업데이트
router.patch(
  "/estimate/:estimateId/status",
  moverEstimateController.updateEstimateStatus
);

// 10. 견적서 업데이트
router.patch("/estimate/:estimateId", moverEstimateController.updateEstimate);

export default router;

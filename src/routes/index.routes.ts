import { Router } from "express";
import moverRouter from "./mover.routes";
import reviewRouter from "./review.route";

import customerEstimateRequestRouter from "./customerEstimateRequest.route";
import estimateRequestRouter from "./estimateRequest.routes";
import moverEstimateRouter from "./moverEstimate.routes";
import favoriteRouter from "./favorite.routes";

const businessRoutes = Router();

// Health Check 엔드포인트
/**
 * GET /health
 * @summary 서버 상태 확인
 * @tags Health
 * @return {object} 200 - 서버 정상 작동
 */
businessRoutes.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 일반 비즈니스 로직 라우터
businessRoutes.use("/movers", moverRouter);
businessRoutes.use("/reviews", reviewRouter);
businessRoutes.use("/estimate-requests", estimateRequestRouter);
businessRoutes.use("/customer-quotes", customerEstimateRequestRouter);
businessRoutes.use("/mover-estimates", moverEstimateRouter);
businessRoutes.use("/favorites", favoriteRouter);

export default businessRoutes;

import { Router } from "express";
import moverRouter from "./mover.routes";
import reviewRouter from "./review.route";

import customerEstimateRequestRouter from "./customerEstimateRequest.route";
import estimateRequestRouter from "./estimateRequest.routes";
import moverEstimateRouter from "./moverEstimate.routes";
import moverScheduleRouter from "./moverSchedule.routes";
import favoriteRouter from "./favorite.routes";
import expirationRouter from "./expiration.routes";
import shareRouter from "./share.route";
const businessRoutes = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         timestamp:
 *           type: string
 *           description: 현재 시간
 *           format: date-time
 *         uptime:
 *           type: number
 *           description: 서버 가동 시간 (초)
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 서버 상태 확인
 *     description: 서버의 현재 상태와 가동 시간을 확인합니다.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 서버 정상 작동
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               success: true
 *               message: ""
 *               timestamp: "2025-07-10T00:33:16.456Z"
 *               uptime: 3600.5
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
businessRoutes.use("/estimateRequests", estimateRequestRouter);
businessRoutes.use("/customer-quotes", customerEstimateRequestRouter);
businessRoutes.use("/mover-estimates", moverEstimateRouter);
businessRoutes.use("/mover-schedules", moverScheduleRouter);
businessRoutes.use("/favorites", favoriteRouter);
businessRoutes.use("/expiration", expirationRouter);
businessRoutes.use("/share", shareRouter);

export default businessRoutes;

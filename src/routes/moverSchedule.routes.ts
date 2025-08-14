import { Router } from "express";
import moverScheduleController from "../controllers/moverSchedule.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { translationMiddleware } from "../middlewares/translationMiddleware";
import { cache } from "../middlewares/cacheMiddleware";

const moverScheduleRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MoverSchedule:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: "스케줄 ID (견적요청 ID)"
 *         customerName:
 *           type: string
 *           description: "고객명"
 *         movingType:
 *           type: string
 *           enum: ["소형이사", "가정이사", "원룸이사", "사무실이사"]
 *           description: "이사 유형"
 *         time:
 *           type: string
 *           description: "이사 시간 (HH:MM 형식)"
 *         status:
 *           type: string
 *           enum: ["confirmed", "pending", "completed"]
 *           description: "스케줄 상태"
 *         fromAddress:
 *           type: string
 *           description: "출발지 주소"
 *         toAddress:
 *           type: string
 *           description: "도착지 주소"
 */

/**
 * @swagger
 * /api/mover-schedules/monthly/{year}/{month}:
 *   get:
 *     summary: "월별 스케줄 조회"
 *     description: "지정한 년월의 기사님 스케줄을 조회합니다. (캘린더용)"
 *     tags:
 *       - MoverSchedule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1900
 *         description: "년도"
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: "월 (1-12)"
 *     responses:
 *       200:
 *         description: "월별 스케줄 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "월별 스케줄 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MoverSchedule'
 *       400:
 *         description: "잘못된 년도 또는 월"
 *       401:
 *         description: "인증 실패"
 *       403:
 *         description: "기사님만 접근 가능"
 *       500:
 *         description: "서버 오류"
 */
moverScheduleRouter.get(
  "/monthly/:year/:month",
  verifyAccessToken,
  cache({ ttlSeconds: 60, varyByAuth: true }),
  translationMiddleware({
    // 동적 텍스트(주소 등)만 번역하고, 상태/유형 키는 표준 값 유지
    excludeKeys: [
      "id",
      "uuid",
      "createdAt",
      "updatedAt",
      "email",
      "phone",
      "url",
      "link",
      "customerName",
      "moveDate",
      "status",
      "movingType",
      "moveType",
    ],
  }),
  moverScheduleController.getMonthlySchedules,
);

export default moverScheduleRouter;

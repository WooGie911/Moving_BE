import { Router } from "express";
import shareController from "../controllers/share.controller";

const router = Router();

/**
 * @swagger
 * /share/{estimateRequestId}/{estimateId}:
 *   get:
 *     summary: 공유 데이터 조회
 *     description: 견적요청과 견적 정보를 조회합니다. 견적 ID는 선택적 매개변수입니다.
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: estimateRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: 견적요청 ID
 *         example: "estimate-request-123"
 *       - in: path
 *         name: estimateId
 *         required: false
 *         schema:
 *           type: string
 *         description: 견적 ID (선택사항)
 *         example: "estimate-456"
 *     responses:
 *       200:
 *         description: 공유 데이터 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     estimateRequest:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "estimate-request-123"
 *                         customerId:
 *                           type: string
 *                           example: "customer-789"
 *                         moveType:
 *                           type: string
 *                           enum: [SMALL, HOME, OFFICE]
 *                           example: "HOME"
 *                         moveDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T00:00:00.000Z"
 *                         fromAddressId:
 *                           type: string
 *                           example: "address-1"
 *                         toAddressId:
 *                           type: string
 *                           example: "address-2"
 *                         description:
 *                           type: string
 *                           nullable: true
 *                           example: "이사 견적 요청입니다."
 *                         status:
 *                           type: string
 *                           example: "PENDING"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-01T00:00:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-01T00:00:00.000Z"
 *                         customer:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "customer-789"
 *                             nickname:
 *                               type: string
 *                               nullable: true
 *                               example: "홍길동"
 *                             name:
 *                               type: string
 *                               nullable: true
 *                               example: "홍길동"
 *                         fromAddress:
 *                           type: object
 *                           properties:
 *                             zoneCode:
 *                               type: string
 *                               example: "12345"
 *                             city:
 *                               type: string
 *                               example: "서울특별시"
 *                             district:
 *                               type: string
 *                               example: "강남구"
 *                             detail:
 *                               type: string
 *                               nullable: true
 *                               example: "테헤란로 123"
 *                             region:
 *                               type: string
 *                               example: "강남"
 *                         toAddress:
 *                           type: object
 *                           properties:
 *                             zoneCode:
 *                               type: string
 *                               example: "67890"
 *                             city:
 *                               type: string
 *                               example: "서울특별시"
 *                             district:
 *                               type: string
 *                               example: "서초구"
 *                             detail:
 *                               type: string
 *                               nullable: true
 *                               example: "서초대로 456"
 *                             region:
 *                               type: string
 *                               example: "서초"
 *                     estimate:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "estimate-456"
 *                         moverId:
 *                           type: string
 *                           example: "mover-123"
 *                         estimateRequestId:
 *                           type: string
 *                           example: "estimate-request-123"
 *                         price:
 *                           type: number
 *                           nullable: true
 *                           example: 150000
 *                         comment:
 *                           type: string
 *                           nullable: true
 *                           example: "안전하고 신속한 이사 서비스를 제공합니다."
 *                         status:
 *                           type: string
 *                           enum: [PROPOSED, ACCEPTED, REJECTED, AUTO_REJECTED]
 *                           example: "PROPOSED"
 *                         rejectReason:
 *                           type: string
 *                           nullable: true
 *                           example: "고객이 다른 업체를 선택했습니다."
 *                         isDesignated:
 *                           type: boolean
 *                           example: false
 *                         workingHours:
 *                           type: string
 *                           nullable: true
 *                           example: "4시간"
 *                         includesPackaging:
 *                           type: boolean
 *                           example: true
 *                         insuranceAmount:
 *                           type: number
 *                           nullable: true
 *                           example: 1000000
 *                         validUntil:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2024-01-31T23:59:59.000Z"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-01T00:00:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-01T00:00:00.000Z"
 *                         deletedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *       400:
 *         description: 잘못된 요청 (견적요청 ID 누락 또는 ControllerError)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "견적요청 ID가 필요합니다."
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 내부 오류가 발생했습니다."
 */
// 공유 데이터 조회 (견적 ID는 선택적)
router.get("/:estimateRequestId/:estimateId?", shareController.getShareData);

export default router;

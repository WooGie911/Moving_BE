import { Router } from "express";
import customerEstimateRequestController from "../controllers/customerEstimateRequest.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { createCustomTranslationMiddleware } from "../middlewares/translationMiddleware";
import { defaultTranslationMiddleware } from "../middlewares/translationMiddleware";

const customerEstimateRequestRouter = Router();

// 견적 요청 관련 번역 미들웨어 (특정 필드만 번역)
const estimateRequestTranslationMiddleware = createCustomTranslationMiddleware([
  "id",
  "uuid",
  "createdAt",
  "updatedAt",
  "email",
  "phone",
  "url",
  "link",
  "name",
  "nickname",
  "customerId",
  "moveType",
  "moveDate",
  "status",
  "isDesignated",
  "price",
  "moverId",
  "estimateRequestId",
  "averageRating",
  "totalReviewCount",
  "workedCount",
  "career",
  "totalFavoriteCount",
  "isFavorite",
  "isVeteran",
  "userType",
]);

/**
 * @swagger
 * /customer-quotes/pending:
 *   get:
 *     summary: 진행중인 견적요청 조회
 *     description: 사용자의 진행중인 견적요청을 조회합니다.
 *     tags: [UserQuote]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 진행중인 견적요청 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PendingEstimateResponse'
 *             example:
 *               success: true
 *               message: "진행중인 견적요청 조회 성공"
 *               data:
 *                 estimateRequest:
 *                   id: "clx123..."
 *                   customerId: "clx456..."
 *                   moveType: "SMALL"
 *                   moveDate: "2025-07-10T00:33:16.456Z"
 *                   createdAt: "2025-07-10T00:33:16.456Z"
 *                   description: "이사 요청 설명"
 *                   status: "PENDING"
 *                   fromAddress:
 *                     city: "서울시"
 *                     district: "강남구"
 *                     detail: "123-456"
 *                     region: "SEOUL"
 *                   toAddress:
 *                     city: "경기도"
 *                     district: "성남시"
 *                     detail: "789-012"
 *                     region: "GYEONGGI"
 *                 estimates:
 *                   - id: "clx789..."
 *                     price: 150000
 *                     comment: "안전하고 신속한 이사 서비스"
 *                     status: "PENDING"
 *                     isDesignated: false
 *                     createdAt: "2025-07-10T01:00:00.000Z"
 *                     mover:
 *                       id: "clx999..."
 *                       name: "김기사"
 *                       userType: ["MOVER"]
 *                       moverImage: null
 *                       nickname: "믿을만한김기사"
 *                       isVeteran: true
 *                       shortIntro: "5년 경력의 전문가"
 *                       detailIntro: "안전하고 신속한 이사"
 *                       career: 5
 *                       workedCount: 100
 *                       averageRating: 4.8
 *                       totalReviewCount: 50
 *                       serviceTypes: []
 *                       serviceAreas: []
 *                       isFavorite: true
 *                       totalFavoriteCount: 12
 *                       Favorite: []
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 사용자 정보입니다."
 *       404:
 *         description: 진행중인 견적요청 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "진행중인 견적요청이 없습니다."
 */
customerEstimateRequestRouter.get(
  "/pending",
  verifyAccessToken,
  estimateRequestTranslationMiddleware,
  customerEstimateRequestController.getPendingEstimateRequest
);

/**
 * @swagger
 * /customer-quotes/received:
 *   get:
 *     summary: 완료된 견적요청 목록 조회
 *     description: 사용자의 완료된 견적요청 목록을 조회합니다.
 *     tags: [UserQuote]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 완료된 견적요청 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompletedEstimateResponse'
 *             example:
 *               success: true
 *               message: "완료된 견적요청 목록 조회 성공"
 *               data:
 *                 - estimateRequest:
 *                     id: "clx123..."
 *                     customerId: "clx456..."
 *                     moveType: "SMALL"
 *                     moveDate: "2025-07-10T00:33:16.456Z"
 *                     createdAt: "2025-07-10T00:33:16.456Z"
 *                     description: "이사 요청 설명"
 *                     status: "COMPLETED"
 *                     fromAddress:
 *                       city: "서울시"
 *                       district: "강남구"
 *                       detail: "123-456"
 *                       region: "SEOUL"
 *                     toAddress:
 *                       city: "경기도"
 *                       district: "성남시"
 *                       detail: "789-012"
 *                       region: "GYEONGGI"
 *                   estimates:
 *                     - id: "clx789..."
 *                       price: 150000
 *                       comment: "안전하고 신속한 이사 서비스"
 *                       status: "ACCEPTED"
 *                       isDesignated: true
 *                       createdAt: "2025-07-10T01:00:00.000Z"
 *                       mover:
 *                         id: "clx999..."
 *                         name: "김기사"
 *                         userType: ["MOVER"]
 *                         moverImage: null
 *                         nickname: "믿을만한김기사"
 *                         isVeteran: true
 *                         shortIntro: "5년 경력의 전문가"
 *                         detailIntro: "안전하고 신속한 이사"
 *                         career: 5
 *                         workedCount: 100
 *                         averageRating: 4.8
 *                         totalReviewCount: 50
 *                         serviceTypes: []
 *                         serviceAreas: []
 *                         isFavorite: true
 *                         totalFavoriteCount: 12
 *                         Favorite: []
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 사용자 정보입니다."
 *       404:
 *         description: 완료된 견적요청 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "완료된 견적요청이 없습니다."
 */
customerEstimateRequestRouter.get(
  "/received",
  verifyAccessToken,
  estimateRequestTranslationMiddleware,
  customerEstimateRequestController.getReceivedEstimateRequests
);

/**
 * @swagger
 * /customer-quotes/confirm:
 *   patch:
 *     summary: 견적 확정
 *     description: 특정 견적을 확정합니다.
 *     tags: [UserQuote]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estimateId
 *         schema:
 *           type: string
 *         required: true
 *         description: 견적 ID
 *     responses:
 *       200:
 *         description: 견적 확정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteSuccessResponse'
 *             example:
 *               success: true
 *               message: "견적 확정 성공"
 *               data:
 *                 estimateRequest:
 *                   id: "clx123..."
 *                   status: "APPROVED"
 *       400:
 *         description: 유효하지 않은 견적 ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 견적 ID입니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 사용자 정보입니다"
 *       404:
 *         description: 진행중인 견적요청 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "진행중인 견적요청이 없습니다"
 */
customerEstimateRequestRouter.patch(
  "/confirm",
  verifyAccessToken,
  customerEstimateRequestController.confirmEstimate
);

/**
 * @swagger
 * /customer-quotes/cancel:
 *   patch:
 *     summary: 견적 취소
 *     description: 특정 견적을 취소합니다.
 *     tags: [UserQuote]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estimateId
 *         schema:
 *           type: string
 *         required: true
 *         description: 견적 ID
 *     responses:
 *       200:
 *         description: 견적 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteSuccessResponse'
 *             example:
 *               success: true
 *               message: "견적 취소 성공"
 *               data:
 *                 id: "clx789..."
 *                 estimateRequestId: "clx123..."
 *                 price: null
 *                 comment: "고객 요청으로 취소"
 *                 status: "REJECTED"
 *                 isDesignated: false
 *                 createdAt: "2025-07-10T01:00:00.000Z"
 *                 updatedAt: "2025-07-10T02:00:00.000Z"
 *       400:
 *         description: 유효하지 않은 견적 ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 견적 ID입니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 사용자 정보입니다"
 *       404:
 *         description: 진행중인 견적요청 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "진행중인 견적요청이 없습니다"
 */
customerEstimateRequestRouter.patch(
  "/cancel",
  verifyAccessToken,
  customerEstimateRequestController.cancelEstimate
);

/**
 * @swagger
 * /customer-quotes/complete:
 *   patch:
 *     summary: 이사완료(구매확정)
 *     description: 확정된 견적을 완료 처리합니다.
 *     tags: [UserQuote]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estimateId
 *         schema:
 *           type: string
 *         required: true
 *         description: 견적 ID
 *     responses:
 *       200:
 *         description: 이사완료 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteSuccessResponse'
 *             example:
 *               success: true
 *               message: "이사완료 성공"
 *               data:
 *                 estimateRequest:
 *                   id: "clx123..."
 *                   customerId: "clx456..."
 *                   moveType: "SMALL"
 *                   moveDate: "2025-07-10T00:33:16.456Z"
 *                   createdAt: "2025-07-10T00:33:16.456Z"
 *                   description: "이사 요청 설명"
 *                   status: "COMPLETED"
 *                   fromAddress:
 *                     city: "서울시"
 *                     district: "강남구"
 *                     detail: "123-456"
 *                     region: "SEOUL"
 *                   toAddress:
 *                     city: "경기도"
 *                     district: "성남시"
 *                     detail: "789-012"
 *                     region: "GYEONGGI"
 *       400:
 *         description: 유효하지 않은 견적 ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 견적 ID입니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 사용자 정보입니다"
 *       404:
 *         description: 진행중인 견적요청 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerQuoteErrorResponse'
 *             example:
 *               success: false
 *               message: "진행중인 견적요청이 없습니다"
 */
customerEstimateRequestRouter.patch(
  "/complete",
  verifyAccessToken,
  customerEstimateRequestController.completeEstimate
);

export default customerEstimateRequestRouter;

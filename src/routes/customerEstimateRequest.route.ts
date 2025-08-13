import { Router } from "express";
import customerEstimateRequestController from "../controllers/customerEstimateRequest.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { createCustomTranslationMiddleware } from "../middlewares/translationMiddleware";
import { cache, invalidateCacheByKey, invalidateCacheByPattern } from "../middlewares/cacheMiddleware";

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
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         city:
 *           type: string
 *           description: 도시
 *         district:
 *           type: string
 *           description: 구역
 *         detail:
 *           type: string
 *           nullable: true
 *           description: 상세주소
 *         region:
 *           type: string
 *           description: 지역
 *         zoneCode:
 *           type: string
 *           description: 우편번호
 *
 *     EstimateRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 견적요청 ID
 *         customerId:
 *           type: string
 *           description: 고객 ID
 *         moveType:
 *           type: string
 *           description: 이사 종류
 *           enum: [SMALL, HOME, OFFICE]
 *         moveDate:
 *           type: string
 *           description: 이사 날짜
 *           format: date-time
 *         createdAt:
 *           type: string
 *           description: 생성일시
 *           format: date-time
 *         description:
 *           type: string
 *           nullable: true
 *           description: 설명
 *         status:
 *           type: string
 *           description: 상태
 *           enum: [PENDING, APPROVED, COMPLETED, EXPIRED]
 *         fromAddress:
 *           $ref: '#/components/schemas/Address'
 *         toAddress:
 *           $ref: '#/components/schemas/Address'
 *
 *     Mover:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 기사님 ID
 *         name:
 *           type: string
 *           description: 이름
 *         userType:
 *           type: array
 *           items:
 *             type: string
 *             enum: [MOVER]
 *           description: 사용자 타입 배열
 *         moverImage:
 *           type: string
 *           nullable: true
 *           description: 프로필 이미지
 *         nickname:
 *           type: string
 *           nullable: true
 *           description: 닉네임
 *         isVeteran:
 *           type: boolean
 *           nullable: true
 *           description: 베테랑 여부
 *         shortIntro:
 *           type: string
 *           nullable: true
 *           description: 간단 소개
 *         detailIntro:
 *           type: string
 *           nullable: true
 *           description: 상세 소개
 *         career:
 *           type: integer
 *           nullable: true
 *           description: 경력
 *         workedCount:
 *           type: integer
 *           nullable: true
 *           description: 작업 횟수
 *         averageRating:
 *           type: number
 *           nullable: true
 *           description: 평균 평점
 *         totalReviewCount:
 *           type: integer
 *           nullable: true
 *           description: 총 리뷰 수
 *         serviceTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: 서비스 타입 목록
 *         serviceAreas:
 *           type: array
 *           items:
 *             type: object
 *           description: 서비스 지역 목록
 *         isFavorite:
 *           type: boolean
 *           description: 찜 여부
 *         totalFavoriteCount:
 *           type: integer
 *           description: 총 찜 수
 *         Favorite:
 *           type: array
 *           items:
 *             type: object
 *           description: 찜 정보
 *
 *     Estimate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 견적 ID
 *         price:
 *           type: integer
 *           nullable: true
 *           description: 견적 가격
 *         comment:
 *           type: string
 *           nullable: true
 *           description: 견적 코멘트
 *         status:
 *           type: string
 *           description: 견적 상태
 *           enum: [PROPOSED, ACCEPTED, AUTO_REJECTED]
 *         isDesignated:
 *           type: boolean
 *           description: 지정 견적 여부
 *         createdAt:
 *           type: string
 *           description: 생성일시
 *           format: date-time
 *         mover:
 *           $ref: '#/components/schemas/Mover'
 *
 *     PendingEstimateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           type: object
 *           properties:
 *             estimateRequest:
 *               $ref: '#/components/schemas/EstimateRequest'
 *               nullable: true
 *             estimates:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Estimate'
 *
 *     CompletedEstimateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               estimateRequest:
 *                 $ref: '#/components/schemas/EstimateRequest'
 *               estimates:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Estimate'
 *
 *     CustomerQuoteSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/EstimateRequest'
 *             - type: object
 *               properties:
 *                 estimateRequest:
 *                   $ref: '#/components/schemas/EstimateRequest'
 *                 estimate:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 견적 ID
 *                     estimateRequestId:
 *                       type: string
 *                       description: 견적요청 ID
 *                     price:
 *                       type: integer
 *                       nullable: true
 *                       description: 견적 가격
 *                     comment:
 *                       type: string
 *                       description: 견적 코멘트
 *                     status:
 *                       type: string
 *                       description: 견적 상태
 *                     isDesignated:
 *                       type: boolean
 *                       description: 지정 견적 여부
 *                     createdAt:
 *                       type: string
 *                       description: 생성일시
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       description: 수정일시
 *                       format: date-time
 *
 *     CustomerQuoteErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 에러 메시지
 *         code:
 *           type: string
 *           description: 에러 코드
 *         layer:
 *           type: string
 *           description: 에러 발생 레이어
 */

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
 *                     status: "PROPOSED"
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
  cache({ ttlSeconds: 30, varyByAuth: true }),
  estimateRequestTranslationMiddleware,
  customerEstimateRequestController.getPendingEstimateRequest,
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
  cache({ ttlSeconds: 30, varyByAuth: true }),
  estimateRequestTranslationMiddleware,
  customerEstimateRequestController.getReceivedEstimateRequests,
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
 *                   customerId: "clx456..."
 *                   moveType: "SMALL"
 *                   moveDate: "2025-07-10T00:33:16.456Z"
 *                   createdAt: "2025-07-10T00:33:16.456Z"
 *                   description: "이사 요청 설명"
 *                   status: "APPROVED"
 *                   fromAddress:
 *                     city: "서울시"
 *                     district: "강남구"
 *                     detail: "123-456"
 *                     region: "SEOUL"
 *                     zoneCode: "06123"
 *                   toAddress:
 *                     city: "경기도"
 *                     district: "성남시"
 *                     detail: "789-012"
 *                     region: "GYEONGGI"
 *                     zoneCode: "13579"
 *                 estimate:
 *                   id: "clx789..."
 *                   estimateRequestId: "clx123..."
 *                   price: 150000
 *                   comment: "안전하고 신속한 이사 서비스"
 *                   status: "ACCEPTED"
 *                   isDesignated: false
 *                   createdAt: "2025-07-10T01:00:00.000Z"
 *                   updatedAt: "2025-07-10T01:00:00.000Z"
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
  async (req, res, next) => {
    // 견적 확정 시 관련 캐시 무효화
    try {
      const userId = (req as any).user?.userId;
      if (userId) {
        await invalidateCacheByPattern(`cache:GET:${req.baseUrl}:*:u:${userId}:*`);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
    next();
  },
  customerEstimateRequestController.confirmEstimate,
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
 *                 status: "AUTO_REJECTED"
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
  async (req, res, next) => {
    // 견적 취소 시 관련 캐시 무효화
    try {
      const userId = (req as any).user?.userId;
      if (userId) {
        await invalidateCacheByPattern(`cache:GET:${req.baseUrl}:*:u:${userId}:*`);
        // 활성 견적요청 캐시도 함께 무효화하여 hasEstimate 최신화 보장
        await invalidateCacheByPattern(`cache:GET:/estimateRequests:/active:u:${userId}:*`);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
    next();
  },
  customerEstimateRequestController.cancelEstimate,
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
  async (req, res, next) => {
    // 이사완료 시 관련 캐시 무효화
    try {
      const userId = (req as any).user?.userId;
      if (userId) {
        await invalidateCacheByPattern(`cache:GET:${req.baseUrl}:*:u:${userId}:*`);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
    next();
  },
  customerEstimateRequestController.completeEstimate,
);

export default customerEstimateRequestRouter;

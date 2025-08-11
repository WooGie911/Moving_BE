import { Router } from "express";
import * as moverController from "../controllers/mover.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { optionalAuth } from "../middlewares/optionalAuth";
import { defaultTranslationMiddleware } from "../middlewares/translationMiddleware";
import { cache } from "../middlewares/cacheMiddleware";

const moverRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MoverInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 기사님 사용자 ID
 *         nickname:
 *           type: string
 *           description: 닉네임
 *           nullable: true
 *         name:
 *           type: string
 *           description: 실명
 *         career:
 *           type: integer
 *           description: 경력 (년)
 *           minimum: 0
 *         shortIntro:
 *           type: string
 *           description: 한줄 소개
 *           nullable: true
 *         detailIntro:
 *           type: string
 *           description: 상세 소개
 *           nullable: true
 *         workedCount:
 *           type: integer
 *           description: 완료된 이사 건수
 *           minimum: 0
 *         averageRating:
 *           type: number
 *           description: 평균 평점
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *         totalReviewCount:
 *           type: integer
 *           description: 총 리뷰 개수
 *           minimum: 0
 *         serviceTypes:
 *           type: array
 *           description: 서비스 타입 배열
 *           items:
 *             type: string
 *             enum: ["SMALL", "HOME", "OFFICE"]
 *         favoriteCount:
 *           type: integer
 *           description: 찜 개수
 *           minimum: 0
 *         moverImage:
 *           type: string
 *           description: 기사님 프로필 이미지 URL
 *           nullable: true
 *         currentAreas:
 *           type: array
 *           description: 현재 서비스 가능 지역
 *           items:
 *             type: string
 *         favorite:
 *           type: array
 *           description: 찜 관계 데이터 (내부용)
 *           items:
 *             type: object
 *
 *     MoverDetailInfo:
 *       allOf:
 *         - $ref: '#/components/schemas/MoverInfo'
 *         - type: object
 *           properties:
 *             isFavorited:
 *               type: boolean
 *               description: 현재 사용자의 찜 여부 (로그인 시에만 제공)
 *             activeEstimateRequest:
 *               type: object
 *               description: 활성 견적 요청 정보 (로그인 시에만 제공)
 *               nullable: true
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 견적 요청 ID
 *                 status:
 *                   type: string
 *                   enum: ["PENDING", "APPROVED"]
 *                   description: 견적 요청 상태
 *                 moveDate:
 *                   type: string
 *                   format: date-time
 *                   description: 이사 예정일
 *
 *     FavoriteMoverInfo:
 *       allOf:
 *         - $ref: '#/components/schemas/MoverInfo'
 *         - type: object
 *           properties:
 *             serviceAreas:
 *               type: array
 *               description: 서비스 지역 정보 (찜한 기사님에서만 제공)
 *               items:
 *                 type: string
 *
 *     MoverListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         data:
 *           type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MoverInfo'
 *               description: 기사님 목록
 *             hasNext:
 *               type: boolean
 *               description: 다음 페이지 존재 여부
 *             nextCursor:
 *               type: string
 *               description: 다음 페이지 커서
 *               nullable: true
 *
 *     MoverErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 에러 메시지
 */

/**
 * @swagger
 * /movers:
 *   get:
 *     summary: 기사님 리스트 조회
 *     description: 기사님 목록을 조회합니다.
 *     tags: [Mover]
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: 지역 필터
 *       - in: query
 *         name: serviceTypeId
 *         schema:
 *           type: integer
 *         description: 서비스 종류 ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 닉네임 검색 키워드
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: ["rating", "career", "confirmed", "review"]
 *           default: "review"
 *         description: 정렬 기준 (rating-평점순, career-경력순, confirmed-완료건수순, review-리뷰순)
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: 무한스크롤 커서
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *         description: 조회할 개수
 *     responses:
 *       200:
 *         description: 기사님 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverListResponse'
 *             example:
 *               success: true
 *               data:
 *                 items:
 *                   - id: "user_123"
 *                     nickname: "믿을만한김기사"
 *                     name: "김***"
 *                     career: 5
 *                     shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다"
 *                     detailIntro: "안전하고 신속한 이사를 약속드립니다. 고객 만족을 최우선으로 생각합니다."
 *                     workedCount: 136
 *                     averageRating: 4.8
 *                     totalReviewCount: 128
 *                     serviceTypes: ["SMALL", "HOME"]
 *                     favoriteCount: 45
 *                     moverImage: "https://s3.amazonaws.com/profiles/profile1.jpg"
 *                     currentAreas: ["SEOUL", "GYEONGGI"]
 *                     serviceAreas: ["SEOUL", "GYEONGGI"]
 *                 hasNext: true
 *                 nextCursor: "user_124"
 *       404:
 *         description: 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverErrorResponse'
 *             example:
 *               success: false
 *               message: "기사님을 찾을 수 없습니다"
 */
moverRouter.get(
  "/",
  cache({ ttlSeconds: 30, varyByAuth: false }), // 공개 데이터이므로 사용자별 캐시 분리 불필요
  defaultTranslationMiddleware,
  moverController.getMoverListController
);

/**
 * @swagger
 * /movers/favorite:
 *   get:
 *     summary: 찜한 기사님 조회
 *     description: 사용자가 찜한 기사님을 최신순 3명까지 조회합니다.
 *     tags: [Mover]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 찜한 기사님 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FavoriteMoverInfo'
 *                   description: 찜한 기사님 목록
 *             example:
 *               success: true
 *               data:
 *                 - id: "user_123"
 *                   nickname: "믿을만한김기사"
 *                   name: "김***"
 *                   career: 5
 *                   shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다"
 *                   detailIntro: "안전하고 신속한 이사를 약속드립니다."
 *                   workedCount: 136
 *                   averageRating: 4.8
 *                   totalReviewCount: 128
 *                   serviceTypes: ["SMALL", "HOME"]
 *                   favoriteCount: 45
 *                   moverImage: "https://s3.amazonaws.com/profiles/profile1.jpg"
 *                   currentAreas: ["SEOUL", "GYEONGGI"]
 *                   serviceAreas: ["SEOUL", "GYEONGGI"]
 *                 - id: "user_124"
 *                   nickname: "전문박기사"
 *                   name: "박***"
 *                   career: 8
 *                   shortIntro: "8년차 전문 이사업체 운영"
 *                   detailIntro: "대형 이사부터 소형 이사까지 모든 것을 처리합니다."
 *                   workedCount: 284
 *                   averageRating: 4.9
 *                   totalReviewCount: 203
 *                   serviceTypes: ["HOME", "OFFICE"]
 *                   favoriteCount: 78
 *                   moverImage: "https://s3.amazonaws.com/profiles/profile2.jpg"
 *                   currentAreas: ["BUSAN", "GYEONGNAM"]
 *                   serviceAreas: ["BUSAN", "GYEONGNAM"]
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: 상태 코드
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               status: 401
 *               message: "인증이 필요합니다."
 *       404:
 *         description: 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: 상태 코드
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               status: 404
 *               message: "찜한 기사님이 없습니다."
 */
moverRouter.get(
  "/favorite",
  verifyAccessToken,
  cache({ ttlSeconds: 30, varyByAuth: true }), // 사용자별 캐시 분리 (개인 데이터)
  defaultTranslationMiddleware,
  moverController.getFavoriteMoversController
);

/**
 * @swagger
 * /movers/{moverId}:
 *   get:
 *     summary: 기사님 상세 조회
 *     description: 기사님의 상세 정보를 조회합니다.
 *     tags: [Mover]
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: string
 *         required: true
 *         description: 기사님 ID
 *     responses:
 *       200:
 *         description: 기사님 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 data:
 *                   $ref: '#/components/schemas/MoverDetailInfo'
 *             example:
 *               success: true
 *               data:
 *                 id: "user_123"
 *                 nickname: "믿을만한김기사"
 *                 name: "김***"
 *                 career: 5
 *                 shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다"
 *                 detailIntro: "안전하고 신속한 이사를 약속드립니다. 고객의 소중한 물건을 내 것처럼 소중히 다루겠습니다."
 *                 workedCount: 136
 *                 averageRating: 4.8
 *                 totalReviewCount: 128
 *                 serviceTypes: ["SMALL", "HOME"]
 *                 favoriteCount: 45
 *                 moverImage: "https://s3.amazonaws.com/profiles/profile1.jpg"
 *                 currentAreas: ["SEOUL", "GYEONGGI"]
 *                 isFavorited: true
 *                 activeEstimateRequest:
 *                   id: 42
 *                   status: "PENDING"
 *                   moveDate: "2025-08-15T09:00:00.000Z"
 *       404:
 *         description: 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: 상태 코드
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               status: 404
 *               message: "기사님을 찾을 수 없습니다."
 */
moverRouter.get(
  "/:moverId",
  optionalAuth,
  cache({ ttlSeconds: 60, varyByAuth: true }), // 사용자별 캐시 분리 (로그인 여부에 따라 다른 응답)
  defaultTranslationMiddleware,
  moverController.getMoverDetailController
);

/**
 * @swagger
 * /movers/{moverId}/quote-request:
 *   post:
 *     summary: 지정 견적 요청
 *     description: 본인 견적(quoteId)에 대해 특정 기사님에게 지정 견적을 요청합니다.
 *     tags: [Mover]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: string
 *         required: true
 *         description: 기사님 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quoteId:
 *                 type: integer
 *                 description: 본인 견적 ID
 *                 required: true
 *               message:
 *                 type: string
 *                 description: 기사님께 전달할 메시지(선택)
 *               expiresAt:
 *                 type: string
 *                 description: 지정 견적 유효기간(ISO 8601)
 *                 format: date-time
 *                 required: true
 *             required:
 *               - quoteId
 *               - expiresAt
 *           example:
 *             quoteId: 4
 *             message: "이사 일정 조율이 필요합니다."
 *             expiresAt: "2025-07-31T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: 지정 견적 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 응답 메시지
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 지정 견적 요청 ID
 *                     quoteId:
 *                       type: integer
 *                       description: 견적 ID
 *                     moverId:
 *                       type: integer
 *                       description: 기사님 ID
 *                     customerId:
 *                       type: integer
 *                       description: 고객 ID
 *                     message:
 *                       type: string
 *                       description: 메시지
 *                     expiresAt:
 *                       type: string
 *                       description: 만료일시
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       description: 상태
 *                     createdAt:
 *                       type: string
 *                       description: 생성일시
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       description: 수정일시
 *                       format: date-time
 *             example:
 *               success: true
 *               message: "지정 견적 요청이 성공적으로 생성되었습니다."
 *               data:
 *                 id: 1
 *                 quoteId: 4
 *                 moverId: 2
 *                 customerId: 9
 *                 message: "이사 일정 조율이 필요합니다."
 *                 expiresAt: "2025-07-31T23:59:59.000Z"
 *                 status: "PENDING"
 *                 createdAt: "2025-07-18T08:00:00.000Z"
 *                 updatedAt: "2025-07-18T08:00:00.000Z"
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               success: false
 *               message: "필수값 누락"
 */
moverRouter.post(
  "/:moverId/quote-request",
  verifyAccessToken,
  moverController.postDesignatedQuoteRequestController
);

/**
 * @swagger
 * /movers/{moverId}/quote-request/check:
 *   get:
 *     summary: 지정 견적 요청 여부 조회
 *     description: 특정 견적(quoteId)에 대해 특정 기사님에게 지정 견적을 요청했는지 확인합니다.
 *     tags: [Mover]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: string
 *         required: true
 *         description: 기사님 ID
 *       - in: query
 *         name: quoteId
 *         schema:
 *           type: string
 *         required: true
 *         description: 견적 ID
 *     responses:
 *       200:
 *         description: 지정 견적 요청 여부 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 응답 메시지
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasRequested:
 *                       type: boolean
 *                       description: 요청 여부
 *                     requestId:
 *                       type: string
 *                       description: 요청 ID
 *                       nullable: true
 *                     message:
 *                       type: string
 *                       description: 메시지
 *                       nullable: true
 *                     expiresAt:
 *                       type: string
 *                       description: 만료일시
 *                       format: date-time
 *                       nullable: true
 *             examples:
 *               requested:
 *                 summary: 요청한 경우
 *                 value:
 *                   success: true
 *                   message: "지정 견적 요청 여부 조회 성공"
 *                   data:
 *                     hasRequested: true
 *                     requestId: "uuid"
 *                     message: "이사 일정 조율이 필요합니다."
 *                     expiresAt: "2025-07-31T23:59:59.000Z"
 *               not_requested:
 *                 summary: 요청하지 않은 경우
 *                 value:
 *                   success: true
 *                   message: "지정 견적 요청 여부 조회 성공"
 *                   data:
 *                     hasRequested: false
 *                     requestId: null
 *                     message: null
 *                     expiresAt: null
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               success: false
 *               message: "잘못된 요청입니다."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 */
moverRouter.get(
  "/:moverId/quote-request/check",
  verifyAccessToken,
  moverController.getDesignatedQuoteRequestCheckController
);

/**
 * @swagger
 * /movers/active-estimate-request/check:
 *   get:
 *     summary: 이사일이 지나지 않은 견적 확인
 *     description: 현재 사용자에게 이사일이 지나지 않은 견적이 있는지 확인합니다.
 *     tags: [Mover]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 이사일이 지나지 않은 견적 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 응답 메시지
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasActiveRequest:
 *                       type: boolean
 *                       description: 이사일이 지나지 않은 견적 존재 여부
 *             example:
 *               success: true
 *               message: "이사일이 지나지 않은 견적 확인 성공"
 *               data:
 *                 hasActiveRequest: true
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 */
moverRouter.get(
  "/active-estimate-request/check",
  verifyAccessToken,
  moverController.checkActiveEstimateRequestController
);

export default moverRouter;

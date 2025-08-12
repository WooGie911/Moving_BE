import { Router } from "express";
import moverEstimateController from "../controllers/moverEstimate.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { createCustomTranslationMiddleware } from "../middlewares/translationMiddleware";
import {
  cache,
  invalidateCacheByKey,
  invalidateCacheByPattern,
} from "../middlewares/cacheMiddleware";

const router = Router();

// 기사님 견적 관련 번역 미들웨어 (특정 필드만 번역)
const moverEstimateTranslationMiddleware = createCustomTranslationMiddleware([
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
  "zoneCode",
]);

// 모든 라우트에 토큰 검증 미들웨어 적용
router.use(verifyAccessToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateEstimateRequest:
 *       type: object
 *       properties:
 *         estimateRequestId:
 *           type: string
 *           description: 견적 요청 ID
 *           required: true
 *         price:
 *           type: integer
 *           description: 견적 가격
 *           required: true
 *         comment:
 *           type: string
 *           description: 견적 코멘트
 *           required: true
 *       required:
 *         - estimateRequestId
 *         - price
 *         - comment
 *
 *     RejectEstimateRequest:
 *       type: object
 *       properties:
 *         estimateRequestId:
 *           type: string
 *           description: 견적 요청 ID
 *           required: true
 *         comment:
 *           type: string
 *           description: 반려 사유
 *           required: true
 *       required:
 *         - estimateRequestId
 *         - comment
 *
 *     EstimateResponse:
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
 *             id:
 *               type: string
 *               description: 견적 ID
 *             estimateRequestId:
 *               type: string
 *               description: 견적 요청 ID
 *             moverId:
 *               type: string
 *               description: 기사님 ID
 *             price:
 *               type: integer
 *               description: 견적 가격
 *             comment:
 *               type: string
 *               description: 견적 코멘트
 *             status:
 *               type: string
 *               description: 상태
 *               enum: [PROPOSED, ACCEPTED, REJECTED, AUTO_REJECTED]
 *             createdAt:
 *               type: string
 *               description: 생성일시
 *               format: date-time
 *
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 주소 ID
 *         zoneCode:
 *           type: string
 *           description: 우편번호
 *         city:
 *           type: string
 *           description: 도시
 *         district:
 *           type: string
 *           description: 구역
 *         detail:
 *           type: string
 *           description: 상세주소
 *         region:
 *           type: string
 *           description: 지역
 *
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 고객 ID
 *         name:
 *           type: string
 *           description: 고객명
 *         currentArea:
 *           type: string
 *           description: 현재 지역
 *         customerImage:
 *           type: string
 *           description: 고객 이미지 URL
 *         nickname:
 *           type: string
 *           description: 닉네임
 *
 *     Mover:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 기사님 ID
 *         name:
 *           type: string
 *           description: 기사님 이름
 *         moverImage:
 *           type: string
 *           description: 기사님 이미지 URL
 *         nickname:
 *           type: string
 *           description: 닉네임
 *         shortIntro:
 *           type: string
 *           description: 짧은 소개
 *         detailIntro:
 *           type: string
 *           description: 상세 소개
 *         career:
 *           type: integer
 *           description: 경력 (년)
 *         workedCount:
 *           type: integer
 *           description: 작업 횟수
 *         averageRating:
 *           type: number
 *           description: 평균 평점
 *         totalReviewCount:
 *           type: integer
 *           description: 총 리뷰 수
 *         serviceTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: 서비스 타입 목록
 *
 *     EstimateRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 견적 요청 ID
 *         customerId:
 *           type: string
 *           description: 고객 ID
 *         moveType:
 *           type: string
 *           description: 이사 타입
 *           enum: [SMALL, HOME, OFFICE]
 *         moveDate:
 *           type: string
 *           description: 이사 날짜
 *           format: date-time
 *         fromAddressId:
 *           type: string
 *           description: 출발지 주소 ID
 *         toAddressId:
 *           type: string
 *           description: 도착지 주소 ID
 *         description:
 *           type: string
 *           description: 설명
 *         status:
 *           type: string
 *           description: 상태
 *         createdAt:
 *           type: string
 *           description: 생성일시
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           description: 수정일시
 *           format: date-time
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         fromAddress:
 *           $ref: '#/components/schemas/Address'
 *         toAddress:
 *           $ref: '#/components/schemas/Address'
 *
 *     MyEstimateResponse:
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
 *               id:
 *                 type: string
 *                 description: 견적서 ID
 *               estimateRequestId:
 *                 type: string
 *                 description: 견적 요청 ID
 *               price:
 *                 type: integer
 *                 description: 가격
 *               comment:
 *                 type: string
 *                 description: 코멘트
 *               status:
 *                 type: string
 *                 description: 상태
 *                 enum: [PROPOSED, ACCEPTED, REJECTED, AUTO_REJECTED]
 *               createdAt:
 *                 type: string
 *                 description: 생성일시
 *                 format: date-time
 *               estimateRequest:
 *                 $ref: '#/components/schemas/EstimateRequest'
 *
 *     RegionEstimateRequestResponse:
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
 *               id:
 *                 type: string
 *                 description: 견적 요청 ID
 *               customerName:
 *                 type: string
 *                 description: 고객명
 *               moveType:
 *                 type: string
 *                 description: 이사 타입
 *                 enum: [SMALL, HOME, OFFICE]
 *               moveDate:
 *                 type: string
 *                 description: 이사 날짜
 *                 format: date-time
 *               description:
 *                 type: string
 *                 description: 설명
 *               fromAddress:
 *                 type: string
 *                 description: 출발지 주소
 *               toAddress:
 *                 type: string
 *                 description: 도착지 주소
 *               createdAt:
 *                 type: string
 *                 description: 생성일시
 *                 format: date-time
 *
 *     DesignatedEstimateRequestResponse:
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
 *               id:
 *                 type: string
 *                 description: 견적 요청 ID
 *               moveType:
 *                 type: string
 *                 description: 이사 타입
 *                 enum: [SMALL, HOME, OFFICE]
 *               moveDate:
 *                 type: string
 *                 description: 이사 날짜
 *                 format: date-time
 *               fromAddress:
 *                 $ref: '#/components/schemas/Address'
 *               toAddress:
 *                 $ref: '#/components/schemas/Address'
 *               customer:
 *                 $ref: '#/components/schemas/Customer'
 *               status:
 *                 type: string
 *                 description: 상태
 *                 enum: [PENDING, COMPLETED, CANCELLED]
 *
 *     AllEstimateRequestsResponse:
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
 *             regionEstimateRequests:
 *               type: array
 *               description: 지역 견적 요청 목록
 *               items:
 *                 $ref: '#/components/schemas/RegionEstimateRequestResponse'
 *             designatedEstimateRequests:
 *               type: array
 *               description: 지정 견적 요청 목록
 *               items:
 *                 $ref: '#/components/schemas/DesignatedEstimateRequestResponse'
 *
 *     UpdateEstimateStatusRequest:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 새로운 상태
 *           enum: [PROPOSED, ACCEPTED, REJECTED, AUTO_REJECTED]
 *           required: true
 *       required:
 *         - status
 *
 *     UpdateEstimateRequest:
 *       type: object
 *       properties:
 *         price:
 *           type: integer
 *           description: 새로운 가격
 *           required: true
 *         comment:
 *           type: string
 *           description: 새로운 코멘트
 *           required: true
 *       required:
 *         - price
 *         - comment
 *
 *     MyRejectedEstimateResponse:
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
 *               id:
 *                 type: string
 *                 description: 견적서 ID
 *               estimateRequestId:
 *                 type: string
 *                 description: 견적 요청 ID
 *               comment:
 *                 type: string
 *                 description: 코멘트
 *               status:
 *                 type: string
 *                 description: 상태
 *                 enum: [REJECTED, AUTO_REJECTED]
 *               createdAt:
 *                 type: string
 *                 description: 생성일시
 *                 format: date-time
 *               estimateRequest:
 *                 $ref: '#/components/schemas/EstimateRequest'
 *
 *     UpdateEstimateStatusResponse:
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
 *             id:
 *               type: string
 *               description: 견적서 ID
 *             status:
 *               type: string
 *               description: 상태
 *               enum: [PROPOSED, ACCEPTED, REJECTED, AUTO_REJECTED]
 *             updatedAt:
 *               type: string
 *               description: 수정일시
 *               format: date-time
 *
 *     UpdateEstimateResponse:
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
 *             id:
 *               type: string
 *               description: 견적서 ID
 *             price:
 *               type: integer
 *               description: 가격
 *             comment:
 *               type: string
 *               description: 코멘트
 *             updatedAt:
 *               type: string
 *               description: 수정일시
 *               format: date-time
 *
 *     MoverEstimateErrorResponse:
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
 */

/**
 * @swagger
 * /mover-estimates/create:
 *   post:
 *     summary: 견적 생성
 *     description: 새로운 견적을 생성합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEstimateRequest'
 *           example:
 *             estimateRequestId: "clx1234567890"
 *             price: 150000
 *             comment: "안전하고 신속한 이사 서비스"
 *     responses:
 *       201:
 *         description: 견적 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstimateResponse'
 *             example:
 *               success: true
 *               message: "견적 생성 성공"
 *               data:
 *                 id: "clx1234567891"
 *                 estimateRequestId: "clx1234567890"
 *                 moverId: "clx1234567892"
 *                 price: 150000
 *                 comment: "안전하고 신속한 이사 서비스"
 *                 status: "PROPOSED"
 *                 createdAt: "2025-07-10T00:33:16.456Z"
 *       400:
 *         description: 유효하지 않은 입력값
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 입력값입니다"
 *               code: "CONTROLLER_VALIDATION_ERROR"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다"
 *               code: "CONTROLLER_AUTH_ERROR"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다"
 *               code: "MOVER_UNAUTHORIZED_ACCESS"
 */
router.post(
  "/create",
  moverEstimateTranslationMiddleware,
  moverEstimateController.createEstimate
);

/**
 * @swagger
 * /mover-estimates/reject:
 *   post:
 *     summary: 견적 반려
 *     description: 견적 요청을 반려합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RejectEstimateRequest'
 *           example:
 *             estimateRequestId: "clx1234567890"
 *             comment: "현재 일정이 맞지 않아 서비스가 어렵습니다."
 *     responses:
 *       201:
 *         description: 견적 반려 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstimateResponse'
 *             example:
 *               success: true
 *               message: "견적 반려 성공"
 *               data:
 *                 id: "clx1234567891"
 *                 estimateRequestId: "clx1234567890"
 *                 moverId: "clx1234567892"
 *                 comment: "현재 일정이 맞지 않아 서비스가 어렵습니다."
 *                 status: "REJECTED"
 *                 createdAt: "2025-07-10T00:33:16.456Z"
 *       400:
 *         description: 유효하지 않은 입력값
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 입력값입니다"
 *               code: "CONTROLLER_VALIDATION_ERROR"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다"
 */
router.post(
  "/reject",
  moverEstimateTranslationMiddleware,
  moverEstimateController.rejectEstimate
);

/**
 * @swagger
 * /mover-estimates/region:
 *   get:
 *     summary: 서비스 가능 지역 견적 조회
 *     description: 기사님의 서비스 가능 지역에 해당하는 견적 요청을 조회합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [moveDate, createdAt]
 *         description: 정렬 기준 (moveDate, createdAt)
 *       - in: query
 *         name: customerName
 *         schema:
 *           type: string
 *         description: 고객명 검색
 *       - in: query
 *         name: moveType
 *         schema:
 *           type: string
 *           enum: [SMALL, HOME, OFFICE]
 *         description: 이사 타입 (SMALL, HOME, OFFICE)
 *     responses:
 *       200:
 *         description: 서비스 가능 지역 견적 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegionEstimateRequestResponse'
 *             example:
 *               success: true
 *               message: "서비스 가능 지역 견적 조회 성공"
 *               data:
 *                 - id: "clx1234567890"
 *                   customerName: "김고객"
 *                   moveType: "SMALL"
 *                   moveDate: "2025-07-15T00:00:00.000Z"
 *                   description: "원룸 이사"
 *                   fromAddress: "서울시 강남구"
 *                   toAddress: "서울시 서초구"
 *                   createdAt: "2025-07-10T00:33:16.456Z"
 *       400:
 *         description: 유효하지 않은 입력값
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 입력값입니다"
 *               code: "CONTROLLER_VALIDATION_ERROR"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다"
 */
router.get(
  "/region",
  cache({ ttlSeconds: 30, varyByAuth: true }),
  moverEstimateTranslationMiddleware,
  moverEstimateController.getRegionEstimateRequest
);

/**
 * @swagger
 * /mover-estimates/designated:
 *   get:
 *     summary: 지정 견적 조회
 *     description: 지정받은 견적 요청을 조회합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [moveDate, createdAt]
 *         description: 정렬 기준
 *       - in: query
 *         name: customerName
 *         schema:
 *           type: string
 *         description: 고객명 검색
 *       - in: query
 *         name: moveType
 *         schema:
 *           type: string
 *           enum: [SMALL, HOME, OFFICE]
 *         description: 이사 타입
 *     responses:
 *       200:
 *         description: 지정 견적 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DesignatedEstimateRequestResponse'
 *             example:
 *               success: true
 *               message: "지정 견적 조회 성공"
 *               data:
 *                 - id: "clx1234567890"
 *                   moveType: "SMALL"
 *                   moveDate: "2025-07-15T00:00:00.000Z"
 *                   fromAddress:
 *                     id: "clx1234567893"
 *                     zoneCode: "06123"
 *                     city: "서울시"
 *                     district: "강남구"
 *                     detail: "강남역 1번 출구"
 *                     region: "SEOUL"
 *                   toAddress:
 *                     id: "clx1234567894"
 *                     zoneCode: "06123"
 *                     city: "서울시"
 *                     district: "서초구"
 *                     detail: "서초역 2번 출구"
 *                     region: "SEOUL"
 *                   customer:
 *                     id: "clx1234567895"
 *                     name: "김고객"
 *                     currentArea: "SEOUL"
 *                     customerImage: "https://example.com/image.jpg"
 *                     nickname: "김고객"
 *                   status: "PENDING"
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
 *       403:
 *         description: 권한 없음
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
 *               message: "권한이 없습니다."
 */
router.get(
  "/designated",
  cache({ ttlSeconds: 30, varyByAuth: true }),
  moverEstimateTranslationMiddleware,
  moverEstimateController.getDesignatedEstimateRequest
);

/**
 * @swagger
 * /mover-estimates/list:
 *   get:
 *     summary: 지역/지정 견적 통합 조회
 *     description: 서비스 가능 지역과 지정받은 견적을 통합 조회합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: 지역 견적 조회 여부
 *       - in: query
 *         name: designated
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: 지정 견적 조회 여부
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [moveDate, createdAt]
 *         description: 정렬 기준
 *       - in: query
 *         name: customerName
 *         schema:
 *           type: string
 *         description: 고객명 검색
 *       - in: query
 *         name: moveType
 *         schema:
 *           type: string
 *           enum: [SMALL, HOME, OFFICE]
 *         description: 이사 타입
 *     responses:
 *       200:
 *         description: 견적 통합 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllEstimateRequestsResponse'
 *             example:
 *               success: true
 *               message: "견적 통합 조회 성공"
 *               data:
 *                 regionEstimateRequests: []
 *                 designatedEstimateRequests: []
 *       400:
 *         description: 유효하지 않은 입력값
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 입력값입니다."
 *               code: "CONTROLLER_VALIDATION_ERROR"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *               code: "CONTROLLER_AUTH_ERROR"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다."
 *               code: "MOVER_UNAUTHORIZED_ACCESS"
 */
router.get(
  "/list",
  cache({ ttlSeconds: 30, varyByAuth: true }),
  moverEstimateTranslationMiddleware,
  moverEstimateController.getAllEstimateRequests
);

/**
 * @swagger
 * /mover-estimates/my-estimates:
 *   get:
 *     summary: 내가 보낸 견적서 조회
 *     description: 내가 작성한 견적서 목록을 조회합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 내가 보낸 견적서 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyEstimateResponse'
 *             example:
 *               success: true
 *               message: "내가 보낸 견적서 조회 성공"
 *               data:
 *                 - id: "clx1234567891"
 *                   estimateRequestId: "clx1234567890"
 *                   price: 150000
 *                   comment: "안전하고 신속한 이사 서비스"
 *                   status: "PROPOSED"
 *                   createdAt: "2025-07-10T00:33:16.456Z"
 *                   estimateRequest:
 *                     moveType: "SMALL"
 *                     moveDate: "2025-07-15T00:00:00.000Z"
 *                     fromAddress:
 *                       id: "clx1234567893"
 *                       zoneCode: "06123"
 *                       city: "서울시"
 *                       district: "강남구"
 *                       detail: "강남역 1번 출구"
 *                       region: "SEOUL"
 *                     toAddress:
 *                       id: "clx1234567894"
 *                       zoneCode: "06123"
 *                       city: "서울시"
 *                       district: "서초구"
 *                       detail: "서초역 2번 출구"
 *                       region: "SEOUL"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *               code: "CONTROLLER_AUTH_ERROR"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다."
 *               code: "MOVER_UNAUTHORIZED_ACCESS"
 */
router.get(
  "/my-estimates",
  cache({ ttlSeconds: 30, varyByAuth: true }),
  moverEstimateTranslationMiddleware,
  moverEstimateController.getMyEstimate
);

/**
 * @swagger
 * /mover-estimates/my-rejected:
 *   get:
 *     summary: 내가 반려한 견적 조회
 *     description: 내가 반려한 견적 요청 목록을 조회합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 내가 반려한 견적 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyRejectedEstimateResponse'
 *                             type: string
 *                             description: 이사 날짜
 *                             format: date-time
 *                           fromAddress:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: 주소 ID
 *                               zoneCode:
 *                                 type: string
 *                                 description: 우편번호
 *                               city:
 *                                 type: string
 *                                 description: 도시
 *                               district:
 *                                 type: string
 *                                 description: 구역
 *                               detail:
 *                                 type: string
 *                                 description: 상세주소
 *                               region:
 *                                 type: string
 *                                 description: 지역
 *                           toAddress:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: 주소 ID
 *                               zoneCode:
 *                                 type: string
 *                                 description: 우편번호
 *                               city:
 *                                 type: string
 *                                 description: 도시
 *                               district:
 *                                 type: string
 *                                 description: 구역
 *                               detail:
 *                                 type: string
 *                                 description: 상세주소
 *                               region:
 *                                 type: string
 *                                 description: 지역
 *             example:
 *               success: true
 *               message: "내가 반려한 견적 조회 성공"
 *               data:
 *                 - id: "clx1234567891"
 *                   estimateRequestId: "clx1234567890"
 *                   comment: "현재 일정이 맞지 않아 서비스가 어렵습니다."
 *                   status: "REJECTED"
 *                   createdAt: "2025-07-10T00:33:16.456Z"
 *                   estimateRequest:
 *                     moveType: "SMALL"
 *                     moveDate: "2025-07-15T00:00:00.000Z"
 *                     fromAddress:
 *                       id: "clx1234567893"
 *                       zoneCode: "06123"
 *                       city: "서울시"
 *                       district: "강남구"
 *                       detail: "강남역 1번 출구"
 *                       region: "SEOUL"
 *                     toAddress:
 *                       id: "clx1234567894"
 *                       zoneCode: "06123"
 *                       city: "서울시"
 *                       district: "서초구"
 *                       detail: "서초역 2번 출구"
 *                       region: "SEOUL"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *               code: "CONTROLLER_AUTH_ERROR"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다."
 *               code: "MOVER_UNAUTHORIZED_ACCESS"
 */
router.get(
  "/my-rejected",
  cache({ ttlSeconds: 30, varyByAuth: true }),
  moverEstimateTranslationMiddleware,
  moverEstimateController.getMyRejectedEstimates
);

/**
 * @swagger
 * /mover-estimates/status:
 *   patch:
 *     summary: 견적 상태 업데이트
 *     description: 견적의 상태를 업데이트합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estimateId
 *         schema:
 *           type: string
 *         required: true
 *         description: 견적서 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEstimateStatusRequest'
 *           example:
 *             status: "ACCEPTED"
 *     responses:
 *       200:
 *         description: 견적 상태 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateEstimateStatusResponse'
 *             example:
 *               success: true
 *               message: "견적 상태 업데이트 성공"
 *               data:
 *                 id: "clx1234567891"
 *                 status: "ACCEPTED"
 *                 updatedAt: "2025-07-10T00:33:16.456Z"
 *       400:
 *         description: 유효하지 않은 입력값
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 입력값입니다."
 *               code: "CONTROLLER_VALIDATION_ERROR"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *               code: "CONTROLLER_AUTH_ERROR"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다."
 *               code: "MOVER_UNAUTHORIZED_ACCESS"
 */
router.patch(
  "/status",
  moverEstimateTranslationMiddleware,
  moverEstimateController.updateEstimateStatus
);

/**
 * @swagger
 * /mover-estimates/estimate:
 *   patch:
 *     summary: 견적서 업데이트
 *     description: 견적서의 가격과 코멘트를 업데이트합니다.
 *     tags: [MoverEstimate]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estimateId
 *         schema:
 *           type: string
 *         required: true
 *         description: 견적서 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEstimateRequest'
 *           example:
 *             price: 160000
 *             comment: "안전하고 신속한 이사 서비스 (가격 조정)"
 *     responses:
 *       200:
 *         description: 견적서 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateEstimateResponse'
 *             example:
 *               success: true
 *               message: "견적서 업데이트 성공"
 *               data:
 *                 id: "clx1234567891"
 *                 price: 160000
 *                 comment: "안전하고 신속한 이사 서비스 (가격 조정)"
 *                 updatedAt: "2025-07-10T00:33:16.456Z"
 *       400:
 *         description: 유효하지 않은 입력값
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 입력값입니다."
 *               code: "CONTROLLER_VALIDATION_ERROR"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *               code: "CONTROLLER_AUTH_ERROR"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverEstimateErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다."
 *               code: "MOVER_UNAUTHORIZED_ACCESS"
 */
router.patch(
  "/estimate",
  moverEstimateTranslationMiddleware,
  moverEstimateController.updateEstimate
);

export default router;

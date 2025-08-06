import { Router } from "express";
import reviewController from "../controllers/review.controller";
import { defaultTranslationMiddleware, createCustomTranslationMiddleware } from "../middlewares/translationMiddleware";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { validateCSRFToken } from "../middlewares/csrfMiddleware";

const reviewRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewRequest:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           description: 평점 (1~5)
 *           minimum: 1
 *           maximum: 5
 *           required: true
 *         content:
 *           type: string
 *           description: 리뷰 내용
 *           required: true
 *
 *     ReviewResponse:
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
 *               description: 리뷰 ID
 *             customerId:
 *               type: string
 *               description: 고객 ID
 *             moverId:
 *               type: string
 *               description: 기사님 ID
 *             estimateRequestId:
 *               type: string
 *               description: 견적 요청 ID
 *             rating:
 *               type: integer
 *               description: 평점
 *             content:
 *               type: string
 *               description: 리뷰 내용
 *             status:
 *               type: string
 *               description: 상태
 *               enum: [COMPLETED]
 *             createdAt:
 *               type: string
 *               description: 생성일시
 *               format: date-time
 *
 *     MoverInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 무버 ID
 *         profileImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         nickname:
 *           type: string
 *           description: 닉네임
 *         shortIntro:
 *           type: string
 *           description: 간단 소개
 *         detailIntro:
 *           type: string
 *           description: 상세 소개
 *
 *     CustomerInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 고객 ID
 *         profileImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         nickname:
 *           type: string
 *           description: 닉네임
 *         shortIntro:
 *           type: string
 *           description: 간단 소개
 *         detailIntro:
 *           type: string
 *           description: 상세 소개
 *
 *     AddressInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 주소 ID
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
 *         zoneCode:
 *           type: string
 *           description: 우편번호
 *
 *     EstimateInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 견적 ID
 *         price:
 *           type: integer
 *           description: 가격
 *         comment:
 *           type: string
 *           description: 코멘트
 *         status:
 *           type: string
 *           description: 상태
 *         isDesignated:
 *           type: boolean
 *           description: 지정 기사님 여부
 *         validUntil:
 *           type: string
 *           description: 유효기간
 *           format: date-time
 *         createdAt:
 *           type: string
 *           description: 생성일시
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           description: 수정일시
 *           format: date-time
 *
 *     EstimateRequestInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 견적 요청 ID
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
 *
 *     WritableEstimateRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 견적 요청 ID
 *         reviewId:
 *           type: string
 *           description: 리뷰 ID
 *         mover:
 *           $ref: '#/components/schemas/MoverInfo'
 *         moveType:
 *           type: string
 *           description: 이사 종류
 *           enum: [SMALL, HOME, OFFICE]
 *         moveDate:
 *           type: string
 *           description: 이사 날짜
 *           format: date-time
 *         description:
 *           type: string
 *           description: 설명
 *         fromAddress:
 *           $ref: '#/components/schemas/AddressInfo'
 *         toAddress:
 *           $ref: '#/components/schemas/AddressInfo'
 *         estimate:
 *           $ref: '#/components/schemas/EstimateInfo'
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
 *
 *     WrittenReview:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 리뷰 ID
 *         rating:
 *           type: integer
 *           description: 평점
 *         content:
 *           type: string
 *           description: 리뷰 내용
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
 *         mover:
 *           $ref: '#/components/schemas/MoverInfo'
 *         moveType:
 *           type: string
 *           description: 이사 종류
 *           enum: [SMALL, HOME, OFFICE]
 *         moveDate:
 *           type: string
 *           description: 이사 날짜
 *           format: date-time
 *         description:
 *           type: string
 *           description: 설명
 *         fromAddress:
 *           $ref: '#/components/schemas/AddressInfo'
 *         toAddress:
 *           $ref: '#/components/schemas/AddressInfo'
 *         estimate:
 *           $ref: '#/components/schemas/EstimateInfo'
 *         estimateRequest:
 *           $ref: '#/components/schemas/EstimateRequestInfo'
 *
 *     ReceivedReview:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 리뷰 ID
 *         rating:
 *           type: integer
 *           description: 평점
 *         content:
 *           type: string
 *           description: 리뷰 내용
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
 *           $ref: '#/components/schemas/CustomerInfo'
 *         moveType:
 *           type: string
 *           description: 이사 종류
 *           enum: [SMALL, HOME, OFFICE]
 *         moveDate:
 *           type: string
 *           description: 이사 날짜
 *           format: date-time
 *         description:
 *           type: string
 *           description: 설명
 *         fromAddress:
 *           $ref: '#/components/schemas/AddressInfo'
 *         toAddress:
 *           $ref: '#/components/schemas/AddressInfo'
 *         estimate:
 *           $ref: '#/components/schemas/EstimateInfo'
 *         estimateRequest:
 *           $ref: '#/components/schemas/EstimateRequestInfo'
 *
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *         total:
 *           type: integer
 *           description: 전체 개수
 *         page:
 *           type: integer
 *           description: 현재 페이지
 *         pageSize:
 *           type: integer
 *           description: 페이지당 개수
 *         hasNextPage:
 *           type: boolean
 *           description: 다음 페이지 존재 여부
 *         hasPrevPage:
 *           type: boolean
 *           description: 이전 페이지 존재 여부
 *
 *     ReviewListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           $ref: '#/components/schemas/PaginationInfo'
 */

/**
 * @swagger
 * /reviews/{reviewId}:
 *   patch:
 *     summary: 리뷰 작성(완료 처리)
 *     description: 리뷰를 작성(완료 처리)합니다.
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *         required: true
 *         description: 리뷰 ID (cuid)
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: 언어 설정 (ko, en, ja, zh)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewRequest'
 *           example:
 *             rating: 5
 *             content: "정말 친절하고 만족스러운 서비스였습니다!"
 *     responses:
 *       200:
 *         description: 리뷰 작성 성공
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
 *                   $ref: '#/components/schemas/ReviewResponse'
 *             example:
 *               success: true
 *               message: "리뷰가 작성되었습니다."
 *               data:
 *                 id: "clx..."
 *                 customerId: "clx..."
 *                 moverId: "clx..."
 *                 estimateRequestId: "clx..."
 *                 rating: 5
 *                 content: "정말 친절하고 만족스러운 서비스였습니다!"
 *                 status: "COMPLETED"
 *                 createdAt: "2025-07-10T00:33:16.456Z"
 */
reviewRouter.patch("/:reviewId", verifyAccessToken, defaultTranslationMiddleware, reviewController.postReview);

/**
 * @swagger
 * /reviews/writable-estimateRequests:
 *   get:
 *     summary: 리뷰 작성 가능한 견적 요청 리스트 조회
 *     description: 리뷰를 작성할 수 있는 견적 요청 리스트를 조회합니다.
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호, 기본값 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 페이지당 개수, 기본값 4
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: 언어 설정 (ko, en, ja, zh)
 *     responses:
 *       200:
 *         description: 리뷰 작성 가능한 견적 요청 리스트 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewListResponse'
 *             example:
 *               success: true
 *               message: "리뷰 작성 가능한 견적 요청 리스트입니다."
 *               data:
 *                 items:
 *                   - id: "clx..."
 *                     reviewId: "clxReview..."
 *                     mover:
 *                       id: "clxMover..."
 *                       profileImage: "https://.../profile.png"
 *                       nickname: "김코드 기사님"
 *                       shortIntro: "이사부터 정리까지 꼼꼼한 마무리!"
 *                       detailIntro: "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다."
 *                       career: 5
 *                       averageRating: 4.8
 *                       totalReviewCount: 127
 *                     moveType: "SMALL"
 *                     moveDate: "2024-07-01T00:00:00.000Z"
 *                     description: "소형 이사 서비스"
 *                     fromAddress:
 *                       id: "clxAddr1..."
 *                       city: "서울시 중구"
 *                       district: "을지로동"
 *                       detail: "101동 202호"
 *                       region: "SEOUL"
 *                       zoneCode: "04521"
 *                     toAddress:
 *                       id: "clxAddr2..."
 *                       city: "경기도 수원시"
 *                       district: "영통구"
 *                       detail: "301동 404호"
 *                       region: "GYEONGGI"
 *                       zoneCode: "16489"
 *                     estimate:
 *                       id: "clxEstimate..."
 *                       price: 180000
 *                       comment: "신속하고 안전한 이사 서비스"
 *                       status: "ACCEPTED"
 *                       isDesignated: true
 *                       validUntil: "2024-07-15T00:00:00.000Z"
 *                       createdAt: "2024-06-25T10:30:00.000Z"
 *                       updatedAt: "2024-06-25T10:30:00.000Z"
 *                     status: "COMPLETED"
 *                     createdAt: "2024-06-20T09:00:00.000Z"
 *                     updatedAt: "2024-06-25T10:30:00.000Z"
 *                 total: 3
 *                 page: 1
 *                 pageSize: 4
 *                 hasNextPage: false
 *                 hasPrevPage: false
 */
reviewRouter.get(
  "/writable-estimateRequests",
  verifyAccessToken,
  createCustomTranslationMiddleware(["id", "reviewId", "profileImage", "nickname", "isDesigned", "price"]),
  reviewController.getWritableEstimateRequests,
);

/**
 * @swagger
 * /reviews/customer/{customerId}:
 *   get:
 *     summary: 내가 쓴 리뷰 목록 조회
 *     description: 내가 작성한 리뷰 목록을 조회합니다.
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: 고객 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호, 기본값 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 페이지당 개수, 기본값 4
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: 언어 설정 (ko, en, ja, zh)
 *     responses:
 *       200:
 *         description: 내가 쓴 리뷰 목록 조회 성공
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: 리뷰 ID
 *                           moverId:
 *                             type: string
 *                             description: 기사님 ID
 *                           profileImage:
 *                             type: string
 *                             description: 프로필 이미지 URL
 *                           nickname:
 *                             type: string
 *                             description: 닉네임
 *                           moverIntroduction:
 *                             type: string
 *                             description: 기사님 소개
 *                           moveType:
 *                             type: string
 *                             description: 이사 타입
 *                             enum: [SMALL, HOME, OFFICE]
 *                           isDesigned:
 *                             type: boolean
 *                             description: 디자인 여부
 *                           fromAddress:
 *                             type: object
 *                             properties:
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
 *                           moveDate:
 *                             type: string
 *                             description: 이사 날짜
 *                             format: date-time
 *                           rating:
 *                             type: integer
 *                             description: 평점
 *                           content:
 *                             type: string
 *                             description: 리뷰 내용
 *                           createdAt:
 *                             type: string
 *                             description: 생성일시
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       description: 전체 개수
 *                     page:
 *                       type: integer
 *                       description: 현재 페이지
 *                     pageSize:
 *                       type: integer
 *                       description: 페이지당 개수
 *             example:
 *               success: true
 *               message: "내가 쓴 리뷰 목록입니다."
 *               data:
 *                 items:
 *                   - id: "clx..."
 *                     rating: 5
 *                     content: "아주 만족스러웠어요!"
 *                     status: "COMPLETED"
 *                     createdAt: "2024-07-18T12:34:56.000Z"
 *                     updatedAt: "2024-07-18T12:34:56.000Z"
 *                     mover:
 *                       id: "clxMover..."
 *                       profileImage: "https://.../profile.png"
 *                       nickname: "김코드 기사님"
 *                       shortIntro: "이사부터 정리까지 꼼꼼한 마무리!"
 *                       detailIntro: "10년간 서울 지역에서 이사 서비스를 제공해온 베테랑 기사님입니다."
 *                     moveType: "SMALL"
 *                     moveDate: "2024-07-01T00:00:00.000Z"
 *                     description: "소형 이사 서비스"
 *                     fromAddress:
 *                       id: "clxAddr1..."
 *                       city: "서울시 중구"
 *                       district: "을지로동"
 *                       detail: "101동 202호"
 *                       region: "SEOUL"
 *                       zoneCode: "04521"
 *                     toAddress:
 *                       id: "clxAddr2..."
 *                       city: "경기도 수원시"
 *                       district: "영통구"
 *                       detail: "301동 404호"
 *                       region: "GYEONGGI"
 *                       zoneCode: "16489"
 *                     estimate:
 *                       id: "clxEstimate..."
 *                       price: 180000
 *                       comment: "신속하고 안전한 이사 서비스"
 *                       status: "ACCEPTED"
 *                       isDesignated: true
 *                       validUntil: "2024-07-15T00:00:00.000Z"
 *                       createdAt: "2024-06-25T10:30:00.000Z"
 *                       updatedAt: "2024-06-25T10:30:00.000Z"
 *                     estimateRequest:
 *                       id: "clxRequest..."
 *                       status: "COMPLETED"
 *                       createdAt: "2024-06-20T09:00:00.000Z"
 *                       updatedAt: "2024-06-25T10:30:00.000Z"
 *                 total: 12
 *                 page: 1
 *                 pageSize: 10
 *                 hasNextPage: true
 *                 hasPrevPage: false
 */
reviewRouter.get(
  "/customer/:customerId",
  verifyAccessToken,
  createCustomTranslationMiddleware(["id", "moverId", "profileImage", "nickname", "isDesigned", "rating"]),
  reviewController.getWrittenReviews,
);

/**
 * @swagger
 * /reviews/mover/{moverId}:
 *   get:
 *     summary: 내가 받은 리뷰 목록 조회
 *     description: 내가 받은 리뷰 목록을 조회합니다.
 *     tags: [Review]
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
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호, 기본값 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 페이지당 개수, 기본값 5
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: 언어 설정 (ko, en, ja, zh)
 *     responses:
 *       200:
 *         description: 내가 받은 리뷰 목록 조회 성공
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: 리뷰 ID
 *                           estimateRequestId:
 *                             type: string
 *                             description: 견적 요청 ID
 *                           customerId:
 *                             type: string
 *                             description: 고객 ID
 *                           moverId:
 *                             type: string
 *                             description: 기사님 ID
 *                           profileImage:
 *                             type: string
 *                             description: 프로필 이미지 URL
 *                           nickname:
 *                             type: string
 *                             description: 닉네임
 *                           moveType:
 *                             type: string
 *                             description: 이사 타입
 *                             enum: [SMALL, HOME, OFFICE]
 *                           isDesigned:
 *                             type: boolean
 *                             description: 디자인 여부
 *                           fromAddress:
 *                             type: object
 *                             properties:
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
 *                           moveDate:
 *                             type: string
 *                             description: 이사 날짜
 *                             format: date-time
 *                           rating:
 *                             type: integer
 *                             description: 평점
 *                           content:
 *                             type: string
 *                             description: 리뷰 내용
 *                           createdAt:
 *                             type: string
 *                             description: 생성일시
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       description: 전체 개수
 *                     page:
 *                       type: integer
 *                       description: 현재 페이지
 *                     pageSize:
 *                       type: integer
 *                       description: 페이지당 개수
 *             example:
 *               success: true
 *               message: "기사님 리뷰 목록입니다."
 *               data:
 *                 items:
 *                   - id: "clx..."
 *                     rating: 4
 *                     content: "기사님이 친절하게 잘 해주셨어요!"
 *                     status: "COMPLETED"
 *                     createdAt: "2024-07-11T09:12:34.000Z"
 *                     updatedAt: "2024-07-11T09:12:34.000Z"
 *                     customer:
 *                       id: "clxCustomer..."
 *                       profileImage: "https://.../profile.png"
 *                       nickname: "홍길동"
 *                       shortIntro: "깔끔한 이사를 원합니다"
 *                       detailIntro: "신중하고 꼼꼼한 이사 서비스를 원하는 고객입니다."
 *                     moveType: "SMALL"
 *                     moveDate: "2024-07-10T00:00:00.000Z"
 *                     description: "소형 이사 서비스"
 *                     fromAddress:
 *                       id: "clxAddr1..."
 *                       city: "서울시 강남구"
 *                       district: "역삼동"
 *                       detail: "101동 202호"
 *                       region: "SEOUL"
 *                       zoneCode: "06123"
 *                     toAddress:
 *                       id: "clxAddr2..."
 *                       city: "경기도 고양시"
 *                       district: "일산동구"
 *                       detail: "301동 404호"
 *                       region: "GYEONGGI"
 *                       zoneCode: "10395"
 *                     estimate:
 *                       id: "clxEstimate..."
 *                       price: 150000
 *                       comment: "신속하고 안전한 이사 서비스"
 *                       status: "ACCEPTED"
 *                       isDesignated: true
 *                       validUntil: "2024-07-20T00:00:00.000Z"
 *                       createdAt: "2024-07-05T14:20:00.000Z"
 *                       updatedAt: "2024-07-05T14:20:00.000Z"
 *                     estimateRequest:
 *                       id: "clxRequest..."
 *                       status: "COMPLETED"
 *                       createdAt: "2024-07-01T10:00:00.000Z"
 *                       updatedAt: "2024-07-05T14:20:00.000Z"
 *                 total: 7
 *                 page: 1
 *                 pageSize: 5
 *                 hasNextPage: true
 *                 hasPrevPage: false
 */
reviewRouter.get(
  "/mover/:moverId",
  createCustomTranslationMiddleware([
    "id",
    "estimateRequestId",
    "customerId",
    "moverId",
    "profileImage",
    "nickname",
    "isDesigned",
    "rating",
    "price",
  ]),
  reviewController.getReceivedReviews,
);

export default reviewRouter;

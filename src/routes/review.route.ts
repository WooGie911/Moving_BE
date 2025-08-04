import { Router } from "express";
import reviewController from "../controllers/review.controller";
import { defaultTranslationMiddleware, createCustomTranslationMiddleware } from "../middlewares/translationMiddleware";
import { verifyAccessToken } from "../middlewares/verifyToken";

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
 *         id:
 *           type: string
 *           description: 리뷰 ID
 *         customerId:
 *           type: string
 *           description: 고객 ID
 *         moverId:
 *           type: string
 *           description: 기사님 ID
 *         estimateRequestId:
 *           type: string
 *           description: 견적 요청 ID
 *         rating:
 *           type: integer
 *           description: 평점
 *         content:
 *           type: string
 *           description: 리뷰 내용
 *         status:
 *           type: string
 *           description: 상태
 *           enum: [COMPLETED]
 *         createdAt:
 *           type: string
 *           description: 생성일시
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
 *         profileImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         nickname:
 *           type: string
 *           description: 닉네임
 *         moveType:
 *           type: string
 *           description: 이사 종류
 *           enum: [SMALL, HOME, OFFICE]
 *         isDesigned:
 *           type: boolean
 *           description: 디자인 여부
 *         moverIntroduction:
 *           type: string
 *           description: 기사님 소개
 *         fromAddress:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *               description: 도시
 *             district:
 *               type: string
 *               description: 구역
 *             detail:
 *               type: string
 *               description: 상세주소
 *             region:
 *               type: string
 *               description: 지역
 *         toAddress:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *               description: 도시
 *             district:
 *               type: string
 *               description: 구역
 *             detail:
 *               type: string
 *               description: 상세주소
 *             region:
 *               type: string
 *               description: 지역
 *         moveDate:
 *           type: string
 *           description: 이사 날짜
 *           format: date-time
 *         price:
 *           type: integer
 *           description: 가격
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
 *           type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WritableEstimateRequest'
 *             total:
 *               type: integer
 *               description: 전체 개수
 *             page:
 *               type: integer
 *               description: 현재 페이지
 *             pageSize:
 *               type: integer
 *               description: 페이지당 개수
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
reviewRouter.patch(
  "/:reviewId",
  verifyAccessToken,
  defaultTranslationMiddleware,
  reviewController.postReview
);

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
 *                     profileImage: "https://.../profile.png"
 *                     nickname: "김코드 기사님"
 *                     moveType: "SMALL"
 *                     isDesigned: true
 *                     moverIntroduction: "이사부터 정리까지 꼼꼼한 마무리!"
 *                     fromAddress:
 *                       city: "서울시 중구"
 *                       district: "을지로동"
 *                       detail: "101동 202호"
 *                       region: "SEOUL"
 *                     toAddress:
 *                       city: "경기도 수원시"
 *                       district: "영통구"
 *                       detail: "301동 404호"
 *                       region: "GYEONGGI"
 *                     moveDate: "2024-07-01T00:00:00.000Z"
 *                     price: 180000
 *                 total: 3
 *                 page: 1
 *                 pageSize: 4
 */
reviewRouter.get(
  "/writable-estimateRequests",
  verifyAccessToken,
  createCustomTranslationMiddleware([
    "id",
    "reviewId", 
    "profileImage",
    "nickname",
    "isDesigned",
    "price"
  ]),
  reviewController.getWritableEstimateRequests
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
 *                     moverId: "clx..."
 *                     profileImage: "https://.../profile.png"
 *                     nickname: "김코드 기사님"
 *                     moverIntroduction: "이사부터 정리까지 꼼꼼한 마무리!"
 *                     moveType: "SMALL"
 *                     isDesigned: true
 *                     fromAddress:
 *                       city: "서울시 중구"
 *                       district: "을지로동"
 *                       detail: "101동 202호"
 *                       region: "SEOUL"
 *                     toAddress:
 *                       city: "경기도 수원시"
 *                       district: "영통구"
 *                       detail: "301동 404호"
 *                       region: "GYEONGGI"
 *                     moveDate: "2024-07-01T00:00:00.000Z"
 *                     rating: 5
 *                     content: "아주 만족스러웠어요!"
 *                     createdAt: "2024-07-18T12:34:56.000Z"
 *                 total: 12
 *                 page: 1
 *                 pageSize: 10
 */
reviewRouter.get(
  "/customer/:customerId",
  verifyAccessToken,
  createCustomTranslationMiddleware([
    "id",
    "moverId",
    "profileImage", 
    "nickname",
    "isDesigned",
    "rating"
  ]),
  reviewController.getWrittenReviews
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
 *               message: "내가 받은 리뷰 목록입니다."
 *               data:
 *                 items:
 *                   - id: "clx..."
 *                     estimateRequestId: "clx..."
 *                     customerId: "clx..."
 *                     moverId: "clx..."
 *                     profileImage: "https://.../profile.png"
 *                     nickname: "홍길동"
 *                     moveType: "SMALL"
 *                     isDesigned: true
 *                     fromAddress:
 *                       city: "서울시 강남구"
 *                       district: "역삼동"
 *                       detail: "101동 202호"
 *                       region: "SEOUL"
 *                     toAddress:
 *                       city: "경기도 고양시"
 *                       district: "일산동구"
 *                       detail: "301동 404호"
 *                       region: "GYEONGGI"
 *                     moveDate: "2024-07-10T00:00:00.000Z"
 *                     rating: 4
 *                     content: "기사님이 친절하게 잘 해주셨어요!"
 *                     createdAt: "2024-07-11T09:12:34.000Z"
 *                 total: 7
 *                 page: 1
 *                 pageSize: 5
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
  reviewController.getReceivedReviews
);

export default reviewRouter;

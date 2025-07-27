import { Router } from "express";
import reviewController from "../controllers/review.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const reviewRouter = Router();

/**
 * PATCH /reviews/:reviewId
 * @summary 리뷰 작성(완료 처리)
 * @description 리뷰를 작성(완료 처리)합니다.
 * @tags Review
 * @security BearerAuth
 * @param {string} reviewId.path.required - 리뷰 ID (cuid)
 * @param {object} request.body.required - 리뷰 작성 정보
 * @param {number} request.body.rating.required - 평점 (1~5)
 * @param {string} request.body.content.required - 리뷰 내용
 * @returns {object} 200 - 리뷰 작성 성공
 * @example request - 요청 예시
 * {
 *   "rating": 5,
 *   "content": "정말 친절하고 만족스러운 서비스였습니다!"
 * }
 *
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "리뷰가 작성되었습니다.",
 *   "data": {
 *     "id": "clx...",
 *     "customerId": "clx...",
 *     "moverId": "clx...",
 *     "estimateRequestId": "clx...",
 *     "rating": 5,
 *     "content": "정말 친절하고 만족스러운 서비스였습니다!",
 *     "status": "COMPLETED",
 *     "createdAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
reviewRouter.patch(
  "/:reviewId",
  verifyAccessToken,
  reviewController.postReview
);

/**
 * GET /reviews/writable-estimateRequests
 * @summary 리뷰 작성 가능한 견적 요청 리스트 조회
 * @description 리뷰를 작성할 수 있는 견적 요청 리스트를 조회합니다.
 * @tags Review
 * @security BearerAuth
 * @param {number} page.query - 페이지 번호 (기본값: 1)
 * @param {number} pageSize.query - 페이지당 개수 (기본값: 4)
 * @returns {object} 200 - 리뷰 작성 가능한 견적 요청 리스트 조회 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "리뷰 작성 가능한 견적 요청 리스트입니다.",
 *   "data": {
 *     "items": [
 *       {
 *         "id": "clx...",
 *         "reviewId": "clxReview...",
 *         "profileImage": "https://.../profile.png",
 *         "nickname": "김코드 기사님",
 *         "moveType": "SMALL",
 *         "isDesigned": true,
 *         "moverIntroduction": "이사부터 정리까지 꼼꼼한 마무리!",
 *         "fromAddress": {
 *           "city": "서울시 중구",
 *           "district": "을지로동",
 *           "detail": "101동 202호",
 *           "region": "SEOUL"
 *         },
 *         "toAddress": {
 *           "city": "경기도 수원시",
 *           "district": "영통구",
 *           "detail": "301동 404호",
 *           "region": "GYEONGGI"
 *         },
 *         "moveDate": "2024-07-01T00:00:00.000Z",
 *         "price": 180000
 *       }
 *     ],
 *     "total": 3,
 *     "page": 1,
 *     "pageSize": 4
 *   }
 * }
 */
reviewRouter.get(
  "/writable-estimateRequests",
  verifyAccessToken,
  reviewController.getWritableEstimateRequests
);

/**
 * GET /reviews/customer/:customerId
 * @summary 내가 쓴 리뷰 목록 조회
 * @description 내가 작성한 리뷰 목록을 조회합니다.
 * @tags Review
 * @param {string} customerId.path.required - 고객 ID
 * @param {number} page.query - 페이지 번호 (기본값: 1)
 * @param {number} pageSize.query - 페이지당 개수 (기본값: 4)
 * @returns {object} 200 - 내가 쓴 리뷰 목록 조회 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "내가 쓴 리뷰 목록입니다.",
 *   "data": {
 *     "items": [
 *       {
 *         "id": "clx...",
 *         "moverId": "clx...",
 *         "profileImage": "https://.../profile.png",
 *         "nickname": "김코드 기사님",
 *         "moverIntroduction": "이사부터 정리까지 꼼꼼한 마무리!",
 *         "moveType": "SMALL",
 *         "isDesigned": true,
 *         "fromAddress": {
 *           "city": "서울시 중구",
 *           "district": "을지로동",
 *           "detail": "101동 202호",
 *           "region": "SEOUL"
 *         },
 *         "toAddress": {
 *           "city": "경기도 수원시",
 *           "district": "영통구",
 *           "detail": "301동 404호",
 *           "region": "GYEONGGI"
 *         },
 *         "moveDate": "2024-07-01T00:00:00.000Z",
 *         "rating": 5,
 *         "content": "아주 만족스러웠어요!",
 *         "createdAt": "2024-07-18T12:34:56.000Z"
 *       }
 *     ],
 *     "total": 12,
 *     "page": 1,
 *     "pageSize": 10
 *   }
 * }
 */
reviewRouter.get(
  "/customer/:customerId",
  verifyAccessToken,
  reviewController.getWrittenReviews
);

/**
 * GET /reviews/mover/:moverId
 * @summary 내가 받은 리뷰 목록 조회
 * @description 내가 받은 리뷰 목록을 조회합니다.
 * @tags Review
 * @param {string} moverId.path.required - 기사님 ID
 * @param {number} page.query - 페이지 번호 (기본값: 1)
 * @param {number} pageSize.query - 페이지당 개수 (기본값: 5)
 * @returns {object} 200 - 내가 받은 리뷰 목록 조회 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "내가 받은 리뷰 목록입니다.",
 *   "data": {
 *     "items": [
 *       {
 *         "id": "clx...",
 *         "estimateRequestId": "clx...",
 *         "customerId": "clx...",
 *         "moverId": "clx...",
 *         "profileImage": "https://.../profile.png",
 *         "nickname": "홍길동",
 *         "moveType": "SMALL",
 *         "isDesigned": true,
 *         "fromAddress": {
 *           "city": "서울시 강남구",
 *           "district": "역삼동",
 *           "detail": "101동 202호",
 *           "region": "SEOUL"
 *         },
 *         "toAddress": {
 *           "city": "경기도 고양시",
 *           "district": "일산동구",
 *           "detail": "301동 404호",
 *           "region": "GYEONGGI"
 *         },
 *         "moveDate": "2024-07-10T00:00:00.000Z",
 *         "rating": 4,
 *         "content": "기사님이 친절하게 잘 해주셨어요!",
 *         "createdAt": "2024-07-11T09:12:34.000Z"
 *       }
 *     ],
 *     "total": 7,
 *     "page": 1,
 *     "pageSize": 5
 *   }
 * }
 */
reviewRouter.get("/mover/:moverId", reviewController.getReceivedReviews);

/**
 * GET /reviews/mover/:moverId/stats
 * @summary 기사님 리뷰 통계 조회
 * @description 기사님이 받은 모든 리뷰의 평균 평점과 평점 분포를 조회합니다.
 * @tags Review
 * @param {string} moverId.path.required - 기사님 ID
 * @returns {object} 200 - 기사님 리뷰 통계 조회 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "기사님 리뷰 통계입니다.",
 *   "data": {
 *     "averageRating": 4.2,
 *     "totalReviewCount": 145,
 *     "ratingDistribution": {
 *       "5": 80,
 *       "4": 45,
 *       "3": 15,
 *       "2": 3,
 *       "1": 2
 *     }
 *   }
 * }
 */
reviewRouter.get("/mover/:moverId/stats", reviewController.getMoverReviewStats);

export default reviewRouter;

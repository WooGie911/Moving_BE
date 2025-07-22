import { Router } from "express";
import reviewController from "../controllers/review.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const reviewRouter = Router();

/**
 * PATCH /reviews/{reviewId}
 * @summary 리뷰 작성(완료 처리)
 * @description 리뷰를 작성(완료 처리)합니다.
 * @tags Review
 * @security BearerAuth
 * @param {number} reviewId.path.required - 리뷰 ID
 * @param {object} request.body.required - 리뷰 작성 정보
 * @param {number} request.body.rating.required - 평점 (1~5)
 * @param {string} request.body.content.required - 리뷰 내용
 * @returns {object} 200 - 리뷰 작성 성공
 * @example request - 요청 예시
 * {
 *   "rating": 5,
 *   "content": "정말 친절하고 만족스러운 서비스였습니다!"
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "리뷰가 작성되었습니다.",
 *   "data": {
 *     "id": 1,
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
 * GET /reviews/writable-quotes
 * @summary 리뷰 작성 가능한 견적 리스트 조회
 * @description 리뷰를 작성할 수 있는 견적 리스트를 조회합니다.
 * @tags Review
 * @security BearerAuth
 * @param {number} page.query - 페이지 번호 (기본값: 1)
 * @param {number} pageSize.query - 페이지당 개수 (기본값: 4)
 * @returns {object} 200 - 리뷰 작성 가능한 견적 리스트 조회 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "리뷰 작성 가능한 견적 리스트입니다.",
 *   "data": {
 *     "items": [
 *       {
 *         "id": "123",
 *         "profileImage": "https://.../profile.png", // 기사 프로필 이미지 URL
 *         "nickname": "김코드 기사님", // 기사 이름
 *         "movingType": "SMALL", // 이사 유형
 *         "isDesigned": true, // 지정 견적 여부
 *         "moverIntroduction": "이사부터 정리까지 꼼꼼한 마무리!", // 기사 소개
 *         "departureAddr": "서울시 중구", // 출발지 주소
 *         "arrivalAddr": "경기도 수원시", // 도착지 주소
 *         "movingDate": "2024-07-01", // 이사 예정일(ISO 8601)
 *         "price": 180000 // 이사 비용(견적가)
 *       }
 *     ],
 *     "total": 3,
 *     "page": 1,
 *     "pageSize": 4
 *   }
 * }
 */
reviewRouter.get(
  "/writable-quotes",
  verifyAccessToken,
  reviewController.getWritableQuotes
);

/**
 * GET /reviews/customer/:customerId
 * @summary 내가 쓴 리뷰 목록 조회
 * @description 내가 작성한 리뷰 목록을 조회합니다.
 * @tags Review
 * @param {number} customerId.path.required - 고객 ID
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
 *         "id": 1, // 리뷰 ID
 *         "moverId": 7, // 기사님 ID
 *         "profileImage": "https://.../profile.png", // 기사 프로필 이미지 URL
 *         "nickname": "김코드 기사님", // 기사 이름
 *         "moverIntroduction": "이사부터 정리까지 꼼꼼한 마무리!", // 기사 소개
 *         "movingType": "SMALL", // 이사 유형
 *         "isDesigned": true, // 지정 견적 여부
 *         "departureAddr": "서울시 중구", // 출발지 주소
 *         "arrivalAddr": "경기도 수원시", // 도착지 주소
 *         "movingDate": "2024-07-01", // 이사일(ISO 8601)
 *         "rating": 5, // 별점
 *         "content": "아주 만족스러웠어요!", // 리뷰 내용
 *         "createdAt": "2024-07-18T12:34:56.000Z" // 리뷰 작성일시(ISO 8601)
 *       }
 *     ],
 *     "total": 12,
 *     "page": 1,
 *     "pageSize": 4
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
 * @param {number} moverId.path.required - 기사님 ID
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
 *         "id": 1,
 *         "quoteId": 10,
 *         "estimateId": 20,
 *         "userId": 5,
 *         "moverId": 7,
 *         "rating": 4,
 *         "content": "기사님이 친절하게 잘 해주셨어요!",
 *         "status": "COMPLETED",
 *         "isPublic": true,
 *         "deletedAt": null,
 *         "createdAt": "2024-07-11T09:12:34.000Z",
 *         "updatedAt": "2024-07-11T09:12:34.000Z",
 *         "quote": {
 *           "id": 10,
 *           "userId": 5,
 *           "movingType": "HOME",
 *           "movingDate": "2024-07-10T00:00:00.000Z",
 *           "departureAddr": "서울시 강남구",
 *           "arrivalAddr": "경기도 고양시",
 *           "departureDetail": "101동 202호",
 *           "arrivalDetail": "301동 404호",
 *           "departureRegion": "SEOUL",
 *           "arrivalRegion": "GYEONGGI",
 *           "description": "가구가 많아요",
 *           "status": "COMPLETED",
 *           "confirmedEstimateId": 20,
 *           "estimatedDistance": 25.5,
 *           "floor": 10,
 *           "hasElevator": true,
 *           "estimateCount": 3,
 *           "isUrgent": false,
 *           "maxBudget": 200000,
 *           "maxEstimateCount": 8,
 *           "designatedEstimateCount": 1,
 *           "maxDesignatedEstimates": 3,
 *           "departureZipCode": "12345",
 *           "arrivalZipCode": "54321",
 *           "departureLatitude": 37.12345,
 *           "departureLongitude": 127.12345,
 *           "arrivalLatitude": 37.54321,
 *           "arrivalLongitude": 127.54321,
 *           "deletedAt": null,
 *           "createdAt": "2024-07-01T10:00:00.000Z",
 *           "updatedAt": "2024-07-10T09:00:00.000Z"
 *         },
 *         "estimate": {
 *           "id": 20,
 *           "quoteId": 10,
 *           "moverId": 7,
 *           "price": 180000,
 *           "description": "포장 포함, 추가 비용 없음",
 *           "status": "ACCEPTED",
 *           "isDesignated": true,
 *           "designatedEstimateRequestId": null,
 *           "validUntil": "2024-07-09T23:59:59.000Z",
 *           "responseTime": 30,
 *           "isReadByCustomer": true,
 *           "workingHours": "4-6시간",
 *           "includesPackaging": true,
 *           "insuranceAmount": 1000000,
 *           "deletedAt": null,
 *           "createdAt": "2024-07-01T12:00:00.000Z",
 *           "updatedAt": "2024-07-10T09:00:00.000Z"
 *         }
 *       }
 *     ],
 *     "total": 7,
 *     "page": 1,
 *     "pageSize": 5
 *   }
 * }
 */
reviewRouter.get(
  "/mover/:moverId",
  verifyAccessToken,
  reviewController.getReceivedReviews
);

export default reviewRouter;

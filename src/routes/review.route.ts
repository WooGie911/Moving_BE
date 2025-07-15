import { Router } from "express";
import reviewController from "../controllers/review.controller";

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
reviewRouter.patch("/:reviewId", reviewController.postReview);

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
 *     "items": [ ... ],
 *     "total": 8,
 *     "page": 1,
 *     "pageSize": 4
 *   }
 * }
 */
reviewRouter.get("/writable-quotes", reviewController.getWritableQuotes);

/**
 * GET /reviews/customer/{customerId}
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
 *     "items": [ ... ],
 *     "total": 12,
 *     "page": 1,
 *     "pageSize": 4
 *   }
 * }
 */
reviewRouter.get("/customer/:customerId", reviewController.getWrittenReviews);

/**
 * GET /reviews/mover/{moverId}
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
 *     "items": [ ... ],
 *     "total": 7,
 *     "page": 1,
 *     "pageSize": 5
 *   }
 * }
 */
reviewRouter.get("/mover/:moverId", reviewController.getReceivedReviews);

export default reviewRouter;

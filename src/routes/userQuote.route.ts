import { Router } from "express";
import userQuoteController from "../controllers/userQuote.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const userQuoteRouter = Router();

/**
 * GET /user-quotes/pending
 * @summary 진행중인 견적 조회
 * @description 사용자의 진행중인 견적을 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @returns {object} 200 - 진행중인 견적 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 진행중인 견적 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "진행중인 견적 조회 성공",
 *   "data": {
 *     "quote": {
 *       "movingType": "SMALL",
 *       "createdAt": "2025-07-10T00:33:16.456Z",
 *       "departureAddr": "서울시 강남구",
 *       "arrivalAddr": "서울시 서초구",
 *       "departureDetail": "강남역 1번 출구",
 *       "status": "ACTIVE",
 *       "confirmedEstimateId": null,
 *       "estimateCount": 3,
 *       "designatedEstimateCount": 1
 *     },
 *     "estimates": [
 *       {
 *         "price": 150000,
 *         "description": "안전하고 신속한 이사 서비스",
 *         "status": "PENDING",
 *         "isDesignated": false,
 *         "mover": {
 *           "id": 1,
 *           "name": "김기사",
 *           "currentRole": "MOVER",
 *           "profile": {
 *             "nickname": "믿을만한김기사",
 *             "profileImage": "https://example.com/image.jpg",
 *             "experience": 5,
 *             "introduction": "5년 경력의 전문가",
 *             "description": "안전하고 신속한 이사",
 *             "completedCount": 100,
 *             "avgRating": 4.8,
 *             "reviewCount": 50,
 *             "favoriteCount": 30
 *           }
 *         }
 *       }
 *     ]
 *   }
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "success": false,
 *   "message": "유효하지 않은 사용자 정보입니다."
 * }
 * @example response - 404 - 데이터 없음
 * {
 *   "success": false,
 *   "message": "진행중인 견적이 없습니다."
 * }
 */
userQuoteRouter.get(
  "/pending",
  verifyAccessToken,
  userQuoteController.getPendingQuote
);

/**
 * GET /user-quotes/received
 * @summary 완료된 견적 목록 조회
 * @description 사용자의 완료된 견적 목록을 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @returns {object} 200 - 완료된 견적 목록 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 완료된 견적 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "완료된 견적 목록 조회 성공",
 *   "data": [
 *     {
 *       "quote": {
 *         "movingType": "SMALL",
 *         "createdAt": "2025-07-10T00:33:16.456Z",
 *         "departureAddr": "서울시 강남구",
 *         "arrivalAddr": "서울시 서초구",
 *         "departureDetail": "강남역 1번 출구",
 *         "status": "COMPLETED",
 *         "confirmedEstimateId": 1,
 *         "estimateCount": 3,
 *         "designatedEstimateCount": 1
 *       },
 *       "estimates": [...]
 *     }
 *   ]
 * }
 */
userQuoteRouter.get(
  "/received",
  verifyAccessToken,
  userQuoteController.getReceivedQuotes
);

/**
 * GET /user-quotes/pending/:estimateId
 * @summary 진행중인 견적 상세 조회
 * @description 진행중인 견적의 특정 견적 상세 정보를 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {number} estimateId.path.required - 견적 ID
 * @returns {object} 200 - 진행중인 견적 상세 조회 성공
 * @returns {object} 400 - 유효하지 않은 견적 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 견적 상세 정보 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "진행중인 견적 상세 조회 성공",
 *   "data": {
 *     "price": 150000,
 *     "description": "안전하고 신속한 이사 서비스",
 *     "status": "PENDING",
 *     "isDesignated": false,
 *     "mover": {
 *       "id": 1,
 *       "name": "김기사",
 *       "currentRole": "MOVER",
 *       "profile": {...}
 *     }
 *   }
 * }
 */
userQuoteRouter.get(
  "/pending/:estimateId",
  verifyAccessToken,
  userQuoteController.getPendingQuoteDetail
);

/**
 * GET /user-quotes/received/:quoteId/:estimateId
 * @summary 완료된 견적 상세 조회
 * @description 완료된 견적의 특정 견적 상세 정보를 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {number} quoteId.path.required - 견적 요청 ID
 * @param {number} estimateId.path.required - 견적 ID
 * @returns {object} 200 - 완료된 견적 상세 조회 성공
 * @returns {object} 400 - 유효하지 않은 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 견적 상세 정보 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "완료된 견적 상세 조회 성공",
 *   "data": {
 *     "price": 150000,
 *     "description": "안전하고 신속한 이사 서비스",
 *     "status": "ACCEPTED",
 *     "isDesignated": false,
 *     "mover": {
 *       "id": 1,
 *       "name": "김기사",
 *       "currentRole": "MOVER",
 *       "profile": {...}
 *     }
 *   }
 * }
 */
userQuoteRouter.get(
  "/received/:quoteId/:estimateId",
  verifyAccessToken,
  userQuoteController.getReceivedQuoteDetail
);

/**
 * PATCH /user-quotes/confirm
 * @summary 견적 확정
 * @description 특정 견적을 확정합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {number} estimateId.query.required - 견적 ID
 * @returns {object} 200 - 견적 확정 성공
 * @returns {object} 400 - 유효하지 않은 견적 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 진행중인 견적 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 확정 성공",
 *   "data": {
 *     "quote": {
 *       "id": 1,
 *       "status": "CONFIRMED",
 *       "confirmedEstimateId": 1
 *     },
 *     "estimate": {
 *       "id": 1,
 *       "status": "ACCEPTED"
 *     }
 *   }
 * }
 */
userQuoteRouter.patch(
  "/confirm",
  verifyAccessToken,
  userQuoteController.confirmEstimate
);

/**
 * POST /customer-quotes/designate
 * @summary 지정 견적 요청
 * @description 특정 기사님에게 지정 견적을 요청합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {number} quoteId.query.required - 견적 ID
 * @param {object} request.body.required - 지정 견적 요청 정보
 * @param {string} request.body.message.required - 요청 메시지
 * @param {number} request.body.moverId.required - 기사님 ID
 * @returns {object} 200 - 지정 견적 요청 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 진행중인 견적 없음
 * @example request - 요청 예시
 * {
 *   "message": "안전하고 신속한 이사 부탁드립니다.",
 *   "moverId": 1
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "지정 견적 요청 성공",
 *   "data": {
 *     "id": 1,
 *     "quoteId": 1,
 *     "customerId": 1,
 *     "moverId": 1,
 *     "message": "안전하고 신속한 이사 부탁드립니다.",
 *     "status": "PENDING",
 *     "expiresAt": "2025-07-09T00:00:00.000Z"
 *   }
 * }
 */
userQuoteRouter.post(
  "/designate",
  verifyAccessToken,
  userQuoteController.designateQuote
);

export default userQuoteRouter;

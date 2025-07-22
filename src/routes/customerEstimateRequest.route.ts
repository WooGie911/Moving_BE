import { Router } from "express";
import customerEstimateRequestController from "../controllers/customerEstimateRequest.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const customerEstimateRequestRouter = Router();

/**
 * GET /customer-quotes/pending
 * @summary 진행중인 견적요청 조회
 * @description 사용자의 진행중인 견적요청을 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @returns {object} 200 - 진행중인 견적요청 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 진행중인 견적요청 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "진행중인 견적요청 조회 성공",
 *   "data": {
 *     "estimateRequest": {
 *       "id": "clx123...",
 *       "customerId": "clx456...",
 *       "moveType": "SMALL",
 *       "moveDate": "2025-07-10T00:33:16.456Z",
 *       "createdAt": "2025-07-10T00:33:16.456Z",
 *       "description": "이사 요청 설명",
 *       "status": "PENDING",
 *       "fromAddress": { ... },
 *       "toAddress": { ... }
 *     },
 *     "estimates": [
 *       {
 *         "id": "clx789...",
 *         "price": 150000,
 *         "comment": "안전하고 신속한 이사 서비스",
 *         "status": "PENDING",
 *         "isDesignated": false,
 *         "createdAt": "2025-07-10T01:00:00.000Z",
 *         "mover": {
 *           "id": "clx999...",
 *           "name": "김기사",
 *           "userType": ["MOVER"],
 *           "moverImage": null,
 *           "nickname": "믿을만한김기사",
 *           "isVeteran": true,
 *           "shortIntro": "5년 경력의 전문가",
 *           "detailIntro": "안전하고 신속한 이사",
 *           "career": 5,
 *           "workedCount": 100,
 *           "averageRating": 4.8,
 *           "totalReviewCount": 50,
 *           "serviceTypes": [],
 *           "serviceAreas": [],
 *           "isFavorite": true,
 *           "totalFavoriteCount": 12,
 *           "Favorite": []
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
 *   "message": "진행중인 견적요청이 없습니다."
 * }
 */
customerEstimateRequestRouter.get(
  "/pending",
  verifyAccessToken,
  customerEstimateRequestController.getPendingEstimateRequest
);

/**
 * GET /customer-quotes/received
 * @summary 완료된 견적요청 목록 조회
 * @description 사용자의 완료된 견적요청 목록을 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @returns {object} 200 - 완료된 견적요청 목록 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 완료된 견적요청 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "완료된 견적요청 목록 조회 성공",
 *   "data": [
 *     {
 *       "estimateRequest": {
 *         "id": "clx123...",
 *         "customerId": "clx456...",
 *         "moveType": "SMALL",
 *         "moveDate": "2025-07-10T00:33:16.456Z",
 *         "createdAt": "2025-07-10T00:33:16.456Z",
 *         "description": "이사 요청 설명",
 *         "status": "COMPLETED",
 *         "fromAddress": { ... },
 *         "toAddress": { ... }
 *       },
 *       "estimates": [
 *         {
 *           "id": "clx789...",
 *           "price": 150000,
 *           "comment": "안전하고 신속한 이사 서비스",
 *           "status": "ACCEPTED",
 *           "isDesignated": false,
 *           "createdAt": "2025-07-10T01:00:00.000Z",
 *           "mover": {
 *             "id": "clx999...",
 *             "name": "김기사",
 *             "userType": ["MOVER"],
 *             "moverImage": null,
 *             "nickname": "믿을만한김기사",
 *             "isVeteran": true,
 *             "shortIntro": "5년 경력의 전문가",
 *             "detailIntro": "안전하고 신속한 이사",
 *             "career": 5,
 *             "workedCount": 100,
 *             "averageRating": 4.8,
 *             "totalReviewCount": 50,
 *             "serviceTypes": [],
 *             "serviceAreas": [],
 *             "isFavorite": true,
 *             "totalFavoriteCount": 12,
 *             "Favorite": []
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
customerEstimateRequestRouter.get(
  "/received",
  verifyAccessToken,
  customerEstimateRequestController.getReceivedEstimateRequests
);

/**
 * GET /customer-quotes/pending/:estimateId
 * @summary 진행중인 견적요청의 특정 견적 상세 조회
 * @description 진행중인 견적요청의 특정 견적 상세 정보를 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {string} estimateId.path.required - 견적 ID
 * @returns {object} 200 - 진행중인 견적 상세 조회 성공
 * @returns {object} 400 - 유효하지 않은 견적 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 견적 상세 정보 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "진행중인 견적 상세 조회 성공",
 *   "data": {
 *     "id": "clx789...",
 *     "price": 150000,
 *     "comment": "안전하고 신속한 이사 서비스",
 *     "status": "PENDING",
 *     "isDesignated": false,
 *     "createdAt": "2025-07-10T01:00:00.000Z",
 *     "mover": {
 *       "id": "clx999...",
 *       "name": "김기사",
 *       "userType": ["MOVER"],
 *       "moverImage": null,
 *       "nickname": "믿을만한김기사",
 *       "isVeteran": true,
 *       "shortIntro": "5년 경력의 전문가",
 *       "detailIntro": "안전하고 신속한 이사",
 *       "career": 5,
 *       "workedCount": 100,
 *       "averageRating": 4.8,
 *       "totalReviewCount": 50,
 *       "serviceTypes": [],
 *       "serviceAreas": [],
 *       "isFavorite": true,
 *       "totalFavoriteCount": 12,
 *       "Favorite": []
 *     }
 *   }
 * }
 */
customerEstimateRequestRouter.get(
  "/pending/:estimateId",
  verifyAccessToken,
  customerEstimateRequestController.getPendingEstimateRequestDetail
);

/**
 * GET /customer-quotes/received/:estimateRequestId/:estimateId
 * @summary 완료된 견적요청의 특정 견적 상세 조회
 * @description 완료된 견적요청의 특정 견적 상세 정보를 조회합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {string} estimateRequestId.path.required - 견적요청 ID
 * @param {string} estimateId.path.required - 견적 ID
 * @returns {object} 200 - 완료된 견적 상세 조회 성공
 * @returns {object} 400 - 유효하지 않은 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 견적 상세 정보 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "완료된 견적 상세 조회 성공",
 *   "data": {
 *     "id": "clx789...",
 *     "price": 150000,
 *     "comment": "안전하고 신속한 이사 서비스",
 *     "status": "ACCEPTED",
 *     "isDesignated": false,
 *     "createdAt": "2025-07-10T01:00:00.000Z",
 *     "mover": {
 *       "id": "clx999...",
 *       "name": "김기사",
 *       "userType": ["MOVER"],
 *       "moverImage": null,
 *       "nickname": "믿을만한김기사",
 *       "isVeteran": true,
 *       "shortIntro": "5년 경력의 전문가",
 *       "detailIntro": "안전하고 신속한 이사",
 *       "career": 5,
 *       "workedCount": 100,
 *       "averageRating": 4.8,
 *       "totalReviewCount": 50,
 *       "serviceTypes": [],
 *       "serviceAreas": [],
 *       "isFavorite": true,
 *       "totalFavoriteCount": 12,
 *       "Favorite": []
 *     }
 *   }
 * }
 */
customerEstimateRequestRouter.get(
  "/received/:estimateRequestId/:estimateId",
  verifyAccessToken,
  customerEstimateRequestController.getReceivedEstimateRequestDetail
);

/**
 * PATCH /customer-quotes/confirm
 * @summary 견적 확정
 * @description 특정 견적을 확정합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {string} estimateId.query.required - 견적 ID
 * @returns {object} 200 - 견적 확정 성공
 * @returns {object} 400 - 유효하지 않은 견적 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 진행중인 견적요청 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 확정 성공",
 *   "data": {
 *     "estimateRequest": {
 *       "id": "clx123...",
 *       "status": "APPROVED"
 *     },
 *     "estimate": {
 *       "id": "clx789...",
 *       "status": "ACCEPTED"
 *     }
 *   }
 * }
 */
customerEstimateRequestRouter.patch(
  "/confirm",
  verifyAccessToken,
  customerEstimateRequestController.confirmEstimate
);

/**
 * POST /customer-quotes/designate
 * @summary 지정 견적 요청
 * @description 특정 기사님에게 지정 견적을 요청합니다.
 * @tags UserQuote
 * @security BearerAuth
 * @param {string} estimateRequestId.query.required - 견적요청 ID
 * @param {object} request.body.required - 지정 견적 요청 정보
 * @param {string} request.body.message.required - 요청 메시지
 * @param {string} request.body.moverId.required - 기사님 ID
 * @returns {object} 200 - 지정 견적 요청 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 진행중인 견적요청 없음
 * @example request - 요청 예시
 * {
 *   "message": "안전하고 신속한 이사 부탁드립니다.",
 *   "moverId": "clx999..."
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "지정 견적 요청 성공",
 *   "data": {
 *     "id": "clx111...",
 *     "estimateRequestId": "clx123...",
 *     "customerId": "clx456...",
 *     "moverId": "clx999...",
 *     "message": "안전하고 신속한 이사 부탁드립니다.",
 *     "status": "PENDING",
 *     "expiresAt": "2025-07-09T00:00:00.000Z"
 *   }
 * }
 */
customerEstimateRequestRouter.post(
  "/designate",
  verifyAccessToken,
  customerEstimateRequestController.designateEstimateRequest
);

export default customerEstimateRequestRouter;

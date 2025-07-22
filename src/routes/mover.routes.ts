import { Router } from "express";
import * as moverController from "../controllers/mover.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const moverRouter = Router();

/**
 * GET /movers
 * @summary 기사님 리스트 조회
 * @tags Mover
 * @description 기사님 목록을 조회
 * @param {string} region.query - 지역 필터
 * @param {number} serviceTypeId.query - 서비스 종류 ID
 * @param {string} search.query - 닉네임 검색 키워드
 * @param {string} sort.query - 정렬 기준
 * @param {number} cursor.query - 무한스크롤 커서
 * @param {number} take.query - 조회할 개수
 * @returns {object} 200 - 기사님 목록 조회 성공
 * @returns {object} 404 - 데이터 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "userId": 4,
 *       "nickname": "믿을만한김기사",
 *       "profileImage": "https://s3.amazonaws.com/profiles/profile1.jpg",
 *       "experience": 5,
 *       "introduction": "5년 경력의 꼼꼼한 이사 전문가입니다",
 *       "description": "안전하고 신속한 이사를 약속드립니다.",
 *       "completedCount": 136,
 *       "avgRating": 5.0,
 *       "reviewCount": 128,
 *       "favoriteCount": 45,
 *       "lastActivityAt": "2025-07-10T00:33:16.456Z",
 *       "user": {
 *         "id": 4,
 *         "name": "김민수",
 *         "email": "mover1@example.com"
 *       },
 *       "serviceRegions": [
 *         { "id": 1, "profileId": 1, "region": "SEOUL" }
 *       ],
 *       "serviceTypes": [
 *         {
 *           "id": 1,
 *           "profileId": 1,
 *           "serviceId": 1,
 *           "service": {
 *             "id": 1,
 *             "name": "소형이사",
 *             "description": "원룸, 투룸 등 소규모 이사",
 *             "isActive": true,
 *             "iconUrl": "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
moverRouter.get("/", moverController.getMoverListController);

/**
 * GET /movers/bookmarked
 * @summary 찜한 기사님 조회 (인증 필요)
 * @tags Mover
 * @description 사용자가 찜한 기사님을 최신순 3명까지 조회
 * @returns {object} 200 - 찜한 기사님 목록 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 데이터 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "userId": 4,
 *       "nickname": "믿을만한김기사",
 *       "profileImage": "https://s3.amazonaws.com/profiles/profile1.jpg",
 *       "experience": 5,
 *       "introduction": "5년 경력의 꼼꼼한 이사 전문가입니다",
 *       "description": "안전하고 신속한 이사를 약속드립니다.",
 *       "completedCount": 136,
 *       "avgRating": 5.0,
 *       "reviewCount": 128,
 *       "favoriteCount": 45,
 *       "lastActivityAt": "2025-07-10T00:33:16.456Z",
 *       "user": {
 *         "id": 4,
 *         "name": "김민수",
 *         "email": "mover1@example.com"
 *       },
 *       "serviceRegions": [
 *         { "id": 1, "profileId": 1, "region": "SEOUL" }
 *       ],
 *       "serviceTypes": [
 *         {
 *           "id": 1,
 *           "profileId": 1,
 *           "serviceId": 1,
 *           "service": {
 *             "id": 1,
 *             "name": "소형이사",
 *             "description": "원룸, 투룸 등 소규모 이사",
 *             "isActive": true,
 *             "iconUrl": "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "status": 401,
 *   "message": "인증이 필요합니다."
 * }
 */
moverRouter.get(
  "/favorite",
  verifyAccessToken,
  moverController.getFavoriteMoversController
);

/**
 * GET /movers/:moverId
 * @summary 기사님 상세 조회
 * @tags Mover
 * @description 기사님의 상세 정보를 조회
 * @param {string} id.path - 기사님 ID
 * @returns {object} 200 - 기사님 상세 정보 조회 성공
 * @returns {object} 404 - 데이터 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "userId": 4,
 *     "nickname": "믿을만한김기사",
 *     "profileImage": "https://s3.amazonaws.com/profiles/profile1.jpg",
 *     "experience": 5,
 *     "introduction": "5년 경력의 꼼꼼한 이사 전문가입니다",
 *     "description": "안전하고 신속한 이사를 약속드립니다.",
 *     "completedCount": 136,
 *     "avgRating": 5.0,
 *     "reviewCount": 128,
 *     "favoriteCount": 45,
 *     "lastActivityAt": "2025-07-10T00:33:16.456Z",
 *     "user": {
 *       "id": 4,
 *       "name": "김민수",
 *       "email": "mover1@example.com"
 *     },
 *     "serviceRegions": [
 *       { "id": 1, "profileId": 1, "region": "SEOUL" }
 *     ],
 *     "serviceTypes": [
 *       {
 *         "id": 1,
 *         "profileId": 1,
 *         "serviceId": 1,
 *         "service": {
 *           "id": 1,
 *           "name": "소형이사",
 *           "description": "원룸, 투룸 등 소규모 이사",
 *           "isActive": true,
 *           "iconUrl": "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *         }
 *       }
 *     ]
 *   }
 * }
 * @example response - 404 - 데이터 없음
 * {
 *   "status": 404,
 *   "message": "기사님을 찾을 수 없습니다."
 * }
 */
moverRouter.get("/:moverId", moverController.getMoverDetailController);

/**
 * POST /movers/:moverId/quote-request
 * @summary 지정 견적 요청 (회원만 가능)
 * @tags Mover
 * @description 본인 견적(quoteId)에 대해 특정 기사님에게 지정 견적을 요청합니다.
 * @security bearerAuth
 * @param {number} moverId.path.required - 기사님 ID
 * @param {object} request.body.required - 요청 바디
 * @property {integer} quoteId.required - 본인 견적 ID
 * @property {string} message - 기사님께 전달할 메시지(선택)
 * @property {string} expiresAt.required - 지정 견적 유효기간(ISO 8601)
 * @returns {object} 200 - 지정 견적 요청 성공
 * @returns {object} 400 - 잘못된 요청
 * @example request - 예시
 * {
 *   "quoteId": 4,
 *   "message": "이사 일정 조율이 필요합니다.",
 *   "expiresAt": "2025-07-31T23:59:59.000Z"
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "지정 견적 요청이 성공적으로 생성되었습니다.",
 *   "data": {
 *     "id": 1,
 *     "quoteId": 4,
 *     "moverId": 2,
 *     "customerId": 9,
 *     "message": "이사 일정 조율이 필요합니다.",
 *     "expiresAt": "2025-07-31T23:59:59.000Z",
 *     "status": "PENDING",
 *     "createdAt": "2025-07-18T08:00:00.000Z",
 *     "updatedAt": "2025-07-18T08:00:00.000Z"
 *   }
 * }
 * @example response - 400 - 실패 예시
 * {
 *   "success": false,
 *   "message": "필수값 누락"
 * }
 */
moverRouter.post(
  "/:moverId/quote-request",
  verifyAccessToken,
  moverController.postDesignatedQuoteRequestController
);

/**
 * GET /movers/:moverId/quote-request/check
 * @summary 지정 견적 요청 여부 조회 (회원만 가능)
 * @tags Mover
 * @description 특정 견적(quoteId)에 대해 특정 기사님에게 지정 견적을 요청했는지 확인합니다.
 * @security bearerAuth
 * @param {number} moverId.path.required - 기사님 ID
 * @param {string} quoteId.query.required - 견적 ID
 * @returns {object} 200 - 지정 견적 요청 여부 조회 성공
 * @returns {object} 400 - 잘못된 요청
 * @returns {object} 401 - 인증 실패
 * @example response - 200 - 성공 예시 (요청한 경우)
 * {
 *   "success": true,
 *   "message": "지정 견적 요청 여부 조회 성공",
 *   "data": {
 *     "hasRequested": true,
 *     "requestId": "uuid",
 *     "message": "이사 일정 조율이 필요합니다.",
 *     "expiresAt": "2025-07-31T23:59:59.000Z"
 *   }
 * }
 * @example response - 200 - 성공 예시 (요청하지 않은 경우)
 * {
 *   "success": true,
 *   "message": "지정 견적 요청 여부 조회 성공",
 *   "data": {
 *     "hasRequested": false,
 *     "requestId": null,
 *     "message": null,
 *     "expiresAt": null
 *   }
 * }
 */
moverRouter.get(
  "/:moverId/quote-request/check",
  verifyAccessToken,
  moverController.getDesignatedQuoteRequestCheckController
);

export default moverRouter;

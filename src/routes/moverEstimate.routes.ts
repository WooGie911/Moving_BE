import { Router } from "express";
import moverEstimateController from "../controllers/moverEstimate.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();

// 모든 라우트에 토큰 검증 미들웨어 적용
router.use(verifyAccessToken);

/**
 * POST /mover-estimates/create
 * @summary 견적 생성
 * @description 새로운 견적을 생성합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {object} request.body.required - 견적 생성 정보
 * @param {number} request.body.quoteId.required - 견적 요청 ID
 * @param {number} request.body.price.required - 견적 가격
 * @param {string} request.body.description.required - 견적 설명
 * @returns {object} 201 - 견적 생성 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example request - 요청 예시
 * {
 *   "quoteId": 1,
 *   "price": 150000,
 *   "description": "안전하고 신속한 이사 서비스"
 * }
 * @example response - 201 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 생성 성공",
 *   "data": {
 *     "id": 1,
 *     "quoteId": 1,
 *     "moverId": 1,
 *     "price": 150000,
 *     "description": "안전하고 신속한 이사 서비스",
 *     "status": "PENDING",
 *     "createdAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.post("/request", moverEstimateController.createEstimate);

/**
 * POST /mover-estimates/reject
 * @summary 견적 반려
 * @description 견적 요청을 반려합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {object} request.body.required - 견적 반려 정보
 * @param {number} request.body.quoteId.required - 견적 요청 ID
 * @param {string} request.body.description.required - 반려 사유
 * @returns {object} 201 - 견적 반려 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example request - 요청 예시
 * {
 *   "quoteId": 1,
 *   "description": "현재 일정이 맞지 않아 서비스가 어렵습니다."
 * }
 * @example response - 201 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 반려 성공",
 *   "data": {
 *     "id": 1,
 *     "quoteId": 1,
 *     "moverId": 1,
 *     "description": "현재 일정이 맞지 않아 서비스가 어렵습니다.",
 *     "status": "REJECTED",
 *     "createdAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.post("/reject", moverEstimateController.rejectEstimate);

/**
 * GET /mover-estimates/region
 * @summary 서비스 가능 지역 견적 조회
 * @description 서비스 가능 지역의 견적 요청을 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} availableRegion.query.required - 서비스 가능 지역
 * @param {string} sortBy.query - 정렬 기준 (movingDate, createdAt)
 * @param {string} customerName.query - 고객명 검색
 * @param {string} movingType.query - 이사 타입 (SMALL, HOME, OFFICE)
 * @returns {object} 200 - 서비스 가능 지역 견적 조회 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "서비스 가능 지역 견적 조회 성공",
 *   "data": [
 *     {
 *       "id": 1,
 *       "movingType": "SMALL",
 *       "movingDate": "2025-07-15",
 *       "departureAddr": "서울시 강남구",
 *       "arrivalAddr": "서울시 서초구",
 *       "customer": {
 *         "id": 1,
 *         "name": "김고객"
 *       },
 *       "status": "ACTIVE",
 *       "estimateCount": 3
 *     }
 *   ]
 * }
 */
router.get("/region", moverEstimateController.getRegionQuote);

/**
 * GET /mover-estimates/designated
 * @summary 지정 견적 조회
 * @description 지정받은 견적 요청을 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} sortBy.query - 정렬 기준 (movingDate, createdAt)
 * @param {string} customerName.query - 고객명 검색
 * @param {string} movingType.query - 이사 타입 (SMALL, HOME, OFFICE)
 * @returns {object} 200 - 지정 견적 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "지정 견적 조회 성공",
 *   "data": [
 *     {
 *       "id": 1,
 *       "movingType": "SMALL",
 *       "movingDate": "2025-07-15",
 *       "departureAddr": "서울시 강남구",
 *       "arrivalAddr": "서울시 서초구",
 *       "customer": {
 *         "id": 1,
 *         "name": "김고객"
 *       },
 *       "status": "ACTIVE",
 *       "designatedRequest": {
 *         "message": "안전하고 신속한 이사 부탁드립니다.",
 *         "expiresAt": "2025-07-09T00:00:00.000Z"
 *       }
 *     }
 *   ]
 * }
 */
router.get("/designated", moverEstimateController.getDesignatedQuote);

/**
 * GET /mover-estimates/list
 * @summary 지역/지정 견적 통합 조회
 * @description 서비스 가능 지역과 지정받은 견적을 통합 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} availableRegion.query.required - 서비스 가능 지역
 * @param {string} sortBy.query - 정렬 기준 (movingDate, createdAt)
 * @param {string} customerName.query - 고객명 검색
 * @param {string} movingType.query - 이사 타입 (SMALL, HOME, OFFICE)
 * @returns {object} 200 - 견적 통합 조회 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 통합 조회 성공",
 *   "data": {
 *     "regionQuotes": [...],
 *     "designatedQuotes": [...]
 *   }
 * }
 */
router.get("/", moverEstimateController.getAllQuotes);

/**
 * GET /mover-estimates/quote/:quoteId
 * @summary 견적 상세 조회
 * @description 특정 견적의 상세 정보를 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {number} quoteId.path.required - 견적 요청 ID
 * @returns {object} 200 - 견적 상세 조회 성공
 * @returns {object} 400 - 유효하지 않은 견적 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @returns {object} 404 - 견적 정보 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 상세 조회 성공",
 *   "data": {
 *     "id": 1,
 *     "movingType": "SMALL",
 *     "movingDate": "2025-07-15",
 *     "departureAddr": "서울시 강남구",
 *     "arrivalAddr": "서울시 서초구",
 *     "departureDetail": "강남역 1번 출구",
 *     "arrivalDetail": "서초역 2번 출구",
 *     "customer": {
 *       "id": 1,
 *       "name": "김고객"
 *     },
 *     "status": "ACTIVE",
 *     "myEstimate": {
 *       "id": 1,
 *       "price": 150000,
 *       "description": "안전하고 신속한 이사 서비스",
 *       "status": "PENDING"
 *     }
 *   }
 * }
 */
router.get("/:quoteId", moverEstimateController.getQuoteById);

/**
 * GET /mover-estimates/my-estimates
 * @summary 내가 보낸 견적서 조회
 * @description 내가 작성한 견적서 목록을 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @returns {object} 200 - 내가 보낸 견적서 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "내가 보낸 견적서 조회 성공",
 *   "data": [
 *     {
 *       "id": 1,
 *       "quoteId": 1,
 *       "price": 150000,
 *       "description": "안전하고 신속한 이사 서비스",
 *       "status": "PENDING",
 *       "createdAt": "2025-07-10T00:33:16.456Z",
 *       "quote": {
 *         "movingType": "SMALL",
 *         "movingDate": "2025-07-15",
 *         "departureAddr": "서울시 강남구",
 *         "arrivalAddr": "서울시 서초구"
 *       }
 *     }
 *   ]
 * }
 */
router.get("/request", moverEstimateController.getMyEstimate);

/**
 * GET /mover-estimates/my-rejected
 * @summary 내가 반려한 견적 조회
 * @description 내가 반려한 견적 요청 목록을 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @returns {object} 200 - 내가 반려한 견적 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "내가 반려한 견적 조회 성공",
 *   "data": [
 *     {
 *       "id": 1,
 *       "quoteId": 1,
 *       "description": "현재 일정이 맞지 않아 서비스가 어렵습니다.",
 *       "status": "REJECTED",
 *       "createdAt": "2025-07-10T00:33:16.456Z",
 *       "quote": {
 *         "movingType": "SMALL",
 *         "movingDate": "2025-07-15",
 *         "departureAddr": "서울시 강남구",
 *         "arrivalAddr": "서울시 서초구"
 *       }
 *     }
 *   ]
 * }
 */
router.get("/reject", moverEstimateController.getMyRejectedQuotes);

/**
 * PATCH /mover-estimates/estimate/status
 * @summary 견적 상태 업데이트
 * @description 견적의 상태를 업데이트합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {number} estimateId.query.required - 견적서 ID
 * @param {object} request.body.required - 상태 업데이트 정보
 * @param {string} request.body.status.required - 새로운 상태 (PENDING, ACCEPTED, REJECTED, EXPIRED)
 * @returns {object} 200 - 견적 상태 업데이트 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example request - 요청 예시
 * {
 *   "status": "ACCEPTED"
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 상태 업데이트 성공",
 *   "data": {
 *     "id": 1,
 *     "status": "ACCEPTED",
 *     "updatedAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.patch("/status", moverEstimateController.updateEstimateStatus);

/**
 * PATCH /mover-estimates/estimate
 * @summary 견적서 업데이트
 * @description 견적서의 가격과 설명을 업데이트합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {number} estimateId.query.required - 견적서 ID
 * @param {object} request.body.required - 견적서 업데이트 정보
 * @param {number} request.body.price.required - 새로운 가격
 * @param {string} request.body.description.required - 새로운 설명
 * @returns {object} 200 - 견적서 업데이트 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example request - 요청 예시
 * {
 *   "price": 160000,
 *   "description": "안전하고 신속한 이사 서비스 (가격 조정)"
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적서 업데이트 성공",
 *   "data": {
 *     "id": 1,
 *     "price": 160000,
 *     "description": "안전하고 신속한 이사 서비스 (가격 조정)",
 *     "updatedAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.patch("/estimate", moverEstimateController.updateEstimate);

export default router;

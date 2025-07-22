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
 * @param {string} request.body.estimateRequestId.required - 견적 요청 ID
 * @param {number} request.body.price.required - 견적 가격
 * @param {string} request.body.comment.required - 견적 코멘트
 * @returns {object} 201 - 견적 생성 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example request - 요청 예시
 * {
 *   "estimateRequestId": "clx1234567890",
 *   "price": 150000,
 *   "comment": "안전하고 신속한 이사 서비스"
 * }
 * @example response - 201 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 생성 성공",
 *   "data": {
 *     "id": "clx1234567891",
 *     "estimateRequestId": "clx1234567890",
 *     "moverId": "clx1234567892",
 *     "price": 150000,
 *     "comment": "안전하고 신속한 이사 서비스",
 *     "status": "PROPOSED",
 *     "createdAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.post("/create", moverEstimateController.createEstimate);

/**
 * POST /mover-estimates/reject
 * @summary 견적 반려
 * @description 견적 요청을 반려합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {object} request.body.required - 견적 반려 정보
 * @param {string} request.body.estimateRequestId.required - 견적 요청 ID
 * @param {string} request.body.comment.required - 반려 사유
 * @returns {object} 201 - 견적 반려 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example request - 요청 예시
 * {
 *   "estimateRequestId": "clx1234567890",
 *   "comment": "현재 일정이 맞지 않아 서비스가 어렵습니다."
 * }
 * @example response - 201 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 반려 성공",
 *   "data": {
 *     "id": "clx1234567891",
 *     "estimateRequestId": "clx1234567890",
 *     "moverId": "clx1234567892",
 *     "comment": "현재 일정이 맞지 않아 서비스가 어렵습니다.",
 *     "status": "REJECTED",
 *     "createdAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.post("/reject", moverEstimateController.rejectEstimate);

/**
 * GET /mover-estimates/region
 * @summary 서비스 가능 지역 견적 조회
 * @description 기사님의 서비스 가능 지역에 해당하는 견적 요청을 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} sortBy.query - 정렬 기준 (moveDate, createdAt)
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
 *       "id": "clx1234567890",
 *       "moveType": "SMALL",
 *       "moveDate": "2025-07-15T00:00:00.000Z",
 *       "fromAddress": {
 *         "id": "clx1234567893",
 *         "postalCode": "06123",
 *         "city": "서울시",
 *         "district": "강남구",
 *         "detail": "강남역 1번 출구",
 *         "region": "SEOUL"
 *       },
 *       "toAddress": {
 *         "id": "clx1234567894",
 *         "postalCode": "06123",
 *         "city": "서울시",
 *         "district": "서초구",
 *         "detail": "서초역 2번 출구",
 *         "region": "SEOUL"
 *       },
 *       "customer": {
 *         "id": "clx1234567895",
 *         "name": "김고객",
 *         "currentArea": "SEOUL",
 *         "customerImage": "https://example.com/image.jpg",
 *         "nickname": "김고객"
 *       },
 *       "status": "PENDING"
 *     }
 *   ]
 * }
 */
router.get("/region", moverEstimateController.getRegionEstimateRequest);

/**
 * GET /mover-estimates/designated
 * @summary 지정 견적 조회
 * @description 지정받은 견적 요청을 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} sortBy.query - 정렬 기준 (moveDate, createdAt)
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
 *       "id": "clx1234567890",
 *       "moveType": "SMALL",
 *       "moveDate": "2025-07-15T00:00:00.000Z",
 *       "fromAddress": {
 *         "id": "clx1234567893",
 *         "postalCode": "06123",
 *         "city": "서울시",
 *         "district": "강남구",
 *         "detail": "강남역 1번 출구",
 *         "region": "SEOUL"
 *       },
 *       "toAddress": {
 *         "id": "clx1234567894",
 *         "postalCode": "06123",
 *         "city": "서울시",
 *         "district": "서초구",
 *         "detail": "서초역 2번 출구",
 *         "region": "SEOUL"
 *       },
 *       "customer": {
 *         "id": "clx1234567895",
 *         "name": "김고객",
 *         "currentArea": "SEOUL",
 *         "customerImage": "https://example.com/image.jpg",
 *         "nickname": "김고객"
 *       },
 *       "status": "PENDING"
 *     }
 *   ]
 * }
 */
router.get("/designated", moverEstimateController.getDesignatedEstimateRequest);

/**
 * GET /mover-estimates/list
 * @summary 지역/지정 견적 통합 조회
 * @description 서비스 가능 지역과 지정받은 견적을 통합 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} region.query - 지역 견적 조회 여부 (true/false)
 * @param {string} designated.query - 지정 견적 조회 여부 (true/false)
 * @param {string} sortBy.query - 정렬 기준 (moveDate, createdAt)
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
 *     "regionEstimateRequests": [...],
 *     "designatedEstimateRequests": [...]
 *   }
 * }
 */
router.get("/list", moverEstimateController.getAllEstimateRequests);

/**
 * GET /mover-estimates/request/:estimateRequestId
 * @summary 견적 요청 상세 조회
 * @description 특정 견적 요청의 상세 정보를 조회합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} estimateRequestId.path.required - 견적 요청 ID
 * @returns {object} 200 - 견적 요청 상세 조회 성공
 * @returns {object} 400 - 유효하지 않은 견적 요청 ID
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @returns {object} 404 - 견적 요청 정보 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청 상세 조회 성공",
 *   "data": {
 *     "id": "clx1234567890",
 *     "moveType": "SMALL",
 *     "moveDate": "2025-07-15T00:00:00.000Z",
 *     "fromAddress": {
 *       "id": "clx1234567893",
 *       "postalCode": "06123",
 *       "city": "서울시",
 *       "district": "강남구",
 *       "detail": "강남역 1번 출구",
 *       "region": "SEOUL"
 *     },
 *     "toAddress": {
 *       "id": "clx1234567894",
 *       "postalCode": "06123",
 *       "city": "서울시",
 *       "district": "서초구",
 *       "detail": "서초역 2번 출구",
 *       "region": "SEOUL"
 *     },
 *     "customer": {
 *       "id": "clx1234567895",
 *       "name": "김고객",
 *       "currentArea": "SEOUL",
 *       "customerImage": "https://example.com/image.jpg",
 *       "nickname": "김고객"
 *     },
 *     "status": "PENDING"
 *   }
 * }
 */
router.get(
  "/request/:estimateRequestId",
  moverEstimateController.getEstimateRequestById
);

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
 *       "id": "clx1234567891",
 *       "estimateRequestId": "clx1234567890",
 *       "price": 150000,
 *       "comment": "안전하고 신속한 이사 서비스",
 *       "status": "PROPOSED",
 *       "createdAt": "2025-07-10T00:33:16.456Z",
 *       "estimateRequest": {
 *         "moveType": "SMALL",
 *         "moveDate": "2025-07-15T00:00:00.000Z",
 *         "fromAddress": {
 *           "id": "clx1234567893",
 *           "postalCode": "06123",
 *           "city": "서울시",
 *           "district": "강남구",
 *           "detail": "강남역 1번 출구",
 *           "region": "SEOUL"
 *         },
 *         "toAddress": {
 *           "id": "clx1234567894",
 *           "postalCode": "06123",
 *           "city": "서울시",
 *           "district": "서초구",
 *           "detail": "서초역 2번 출구",
 *           "region": "SEOUL"
 *         }
 *       }
 *     }
 *   ]
 * }
 */
router.get("/my-estimates", moverEstimateController.getMyEstimate);

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
 *       "id": "clx1234567891",
 *       "estimateRequestId": "clx1234567890",
 *       "comment": "현재 일정이 맞지 않아 서비스가 어렵습니다.",
 *       "status": "REJECTED",
 *       "createdAt": "2025-07-10T00:33:16.456Z",
 *       "estimateRequest": {
 *         "moveType": "SMALL",
 *         "moveDate": "2025-07-15T00:00:00.000Z",
 *         "fromAddress": {
 *           "id": "clx1234567893",
 *           "postalCode": "06123",
 *           "city": "서울시",
 *           "district": "강남구",
 *           "detail": "강남역 1번 출구",
 *           "region": "SEOUL"
 *         },
 *         "toAddress": {
 *           "id": "clx1234567894",
 *           "postalCode": "06123",
 *           "city": "서울시",
 *           "district": "서초구",
 *           "detail": "서초역 2번 출구",
 *           "region": "SEOUL"
 *         }
 *       }
 *     }
 *   ]
 * }
 */
router.get("/my-rejected", moverEstimateController.getMyRejectedEstimates);

/**
 * PATCH /mover-estimates/status
 * @summary 견적 상태 업데이트
 * @description 견적의 상태를 업데이트합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} estimateId.query.required - 견적서 ID
 * @param {object} request.body.required - 상태 업데이트 정보
 * @param {string} request.body.status.required - 새로운 상태 (PROPOSED, ACCEPTED, REJECTED, AUTO_REJECTED)
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
 *     "id": "clx1234567891",
 *     "status": "ACCEPTED",
 *     "updatedAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.patch("/status", moverEstimateController.updateEstimateStatus);

/**
 * PATCH /mover-estimates/estimate
 * @summary 견적서 업데이트
 * @description 견적서의 가격과 코멘트를 업데이트합니다.
 * @tags MoverEstimate
 * @security BearerAuth
 * @param {string} estimateId.query.required - 견적서 ID
 * @param {object} request.body.required - 견적서 업데이트 정보
 * @param {number} request.body.price.required - 새로운 가격
 * @param {string} request.body.comment.required - 새로운 코멘트
 * @returns {object} 200 - 견적서 업데이트 성공
 * @returns {object} 400 - 유효하지 않은 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 403 - 권한 없음
 * @example request - 요청 예시
 * {
 *   "price": 160000,
 *   "comment": "안전하고 신속한 이사 서비스 (가격 조정)"
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적서 업데이트 성공",
 *   "data": {
 *     "id": "clx1234567891",
 *     "price": 160000,
 *     "comment": "안전하고 신속한 이사 서비스 (가격 조정)",
 *     "updatedAt": "2025-07-10T00:33:16.456Z"
 *   }
 * }
 */
router.patch("/estimate", moverEstimateController.updateEstimate);

export default router;

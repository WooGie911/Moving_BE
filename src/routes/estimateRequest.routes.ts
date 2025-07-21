import { Router } from "express";
import EstimateRequestController from "../controllers/estimateRequest.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();
const estimateRequestController = new EstimateRequestController();

/**
 * POST /estimate-requests
 * @summary 이사 견적 요청 생성
 * @description 한 사용자는 PENDING 상태의 견적 요청이 1개만 존재할 수 있습니다. 기존 요청이 CANCELLED, EXPIRED, COMPLETED 상태일 때만 새로 생성할 수 있습니다.
 * @tags EstimateRequest
 * @security BearerAuth
 * @param {object} request.body.required - 견적 요청 정보
 * @param {string} request.body.moveType.required - 이사 종류 (SMALL, HOME, OFFICE)
 * @param {string} request.body.fromAddressId.required - 출발지 주소 ID
 * @param {string} request.body.toAddressId.required - 도착지 주소 ID
 * @param {string} request.body.moveDate.required - 이사 날짜 (YYYY-MM-DD 형식)
 * @param {string} request.body.description - 추가 설명
 * @returns {object} 201 - 견적 요청 생성 성공
 * @returns {object} 400 - 잘못된 입력값 또는 이미 진행중인 견적 요청 존재
 * @returns {object} 401 - 인증 실패
 * @returns {object} 500 - 서버 내부 오류
 * @example request - 요청 예시
 * {
 *   "moveType": "HOME",
 *   "fromAddressId": "clx123abc456",
 *   "toAddressId": "clx789def012",
 *   "moveDate": "2024-07-01",
 *   "description": "엘리베이터 있음, 반려동물 동반"
 * }
 * @example response - 201 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 생성되었습니다.",
 *   "data": { ... }
 * }
 * @example response - 400 - 이미 진행중인 견적 요청이 있습니다.
 * {
 *   "success": false,
 *   "message": "이미 진행중인 견적 요청이 있습니다."
 * }
 * @example response - 400 - 잘못된 입력값
 * {
 *   "success": false,
 *   "message": "필수 필드가 누락되었습니다. (moveType, fromAddressId, toAddressId, moveDate)"
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "success": false,
 *   "message": "인증이 필요합니다."
 * }
 * @example response - 500 - 서버 내부 오류
 * {
 *   "success": false,
 *   "message": "서버 내부 오류가 발생했습니다."
 * }
 */
router.post("/estimate-requests", verifyAccessToken, estimateRequestController.createEstimateRequest);

/**
 * GET /estimate-requests/active
 * @summary 활성 견적 요청 조회
 * @description 현재 사용자의 활성 상태(PENDING) 견적 요청을 조회합니다.
 * @tags EstimateRequest
 * @security BearerAuth
 * @returns {object} 200 - 활성 견적 요청 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 500 - 서버 내부 오류
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "활성 견적 요청 조회 성공",
 *   "data": { ... }
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "success": false,
 *   "message": "인증이 필요합니다."
 * }
 * @example response - 404 - 데이터 없음
 * {
 *   "success": false,
 *   "message": "활성 견적 요청이 없습니다."
 * }
 * @example response - 500 - 서버 내부 오류
 * {
 *   "success": false,
 *   "message": "서버 내부 오류가 발생했습니다."
 * }
 */
router.get("/estimate-requests/active", verifyAccessToken, estimateRequestController.getActiveEstimateRequest);

/**
 * PATCH /estimate-requests/active
 * @summary 활성 견적 요청 수정
 * @description PENDING 상태일 때만 수정 가능
 * @tags EstimateRequest
 * @security BearerAuth
 * @param {object} request.body.required - 수정할 견적 요청 정보
 * @param {string} request.body.moveType - 이사 종류 (SMALL, HOME, OFFICE)
 * @param {string} request.body.fromAddressId - 출발지 주소 ID
 * @param {string} request.body.toAddressId - 도착지 주소 ID
 * @param {string} request.body.moveDate - 이사 날짜 (YYYY-MM-DD 형식)
 * @param {string} request.body.description - 추가 설명
 * @returns {object} 200 - 견적 요청 수정 성공
 * @returns {object} 400 - 잘못된 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 500 - 서버 내부 오류
 * @example request - 요청 예시
 * {
 *   "moveType": "OFFICE",
 *   "moveDate": "2024-07-10",
 *   "description": "짐이 많음, 사다리차 필요"
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 수정되었습니다.",
 *   "data": { ... }
 * }
 * @example response - 400 - 잘못된 입력값
 * {
 *   "success": false,
 *   "message": "수정할 데이터가 없습니다."
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "success": false,
 *   "message": "인증이 필요합니다."
 * }
 * @example response - 404 - 활성 견적 요청 없음
 * {
 *   "success": false,
 *   "message": "활성 견적 요청이 없습니다."
 * }
 * @example response - 500 - 서버 내부 오류
 * {
 *   "success": false,
 *   "message": "서버 내부 오류가 발생했습니다."
 * }
 */
router.patch("/estimate-requests/active", verifyAccessToken, estimateRequestController.updateActiveEstimateRequest);

/**
 * DELETE /estimate-requests/active
 * @summary 활성 견적 요청 취소
 * @description PENDING 상태이면서 기사 견적이 없는 경우만 취소 가능. 취소 시 상태는 CANCELLED로 변경
 * @tags EstimateRequest
 * @security BearerAuth
 * @returns {object} 200 - 견적 요청 취소 성공
 * @returns {object} 400 - 기사님이 견적을 제출한 경우
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 500 - 서버 내부 오류
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 취소되었습니다."
 * }
 * @example response - 400 - 기사님이 견적을 제출한 경우
 * {
 *   "success": false,
 *   "message": "기사님이 견적을 제출한 경우 취소할 수 없습니다."
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "success": false,
 *   "message": "인증이 필요합니다."
 * }
 * @example response - 404 - 활성 견적 요청 없음
 * {
 *   "success": false,
 *   "message": "활성 견적 요청이 없습니다."
 * }
 * @example response - 500 - 서버 내부 오류
 * {
 *   "success": false,
 *   "message": "서버 내부 오류가 발생했습니다."
 * }
 */
router.delete("/estimate-requests/active", verifyAccessToken, estimateRequestController.cancelActiveEstimateRequest);

export default router;

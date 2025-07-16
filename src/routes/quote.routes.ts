import { Router } from "express";
import QuoteController from "../controllers/quote.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();
const quoteController = new QuoteController();

/**
 * POST /quotes
 * @summary 견적 요청 생성
 * @description 새로운 이사 견적 요청을 생성합니다.
 * @tags Quote
 * @security BearerAuth
 * @param {object} request.body.required - 견적 요청 정보
 * @param {string} request.body.movingType.required - 이사 종류 (SMALL, HOME, OFFICE)
 * @param {object} request.body.departure.required - 출발지 주소 정보
 * @param {string} request.body.departure.zonecode - 우편번호
 * @param {string} request.body.departure.roadAddress.required - 도로명 주소
 * @param {string} request.body.departure.jibunAddress - 지번 주소
 * @param {string} request.body.departure.extraAddress - 추가 주소
 * @param {string} request.body.departure.detailAddress - 상세 주소
 * @param {object} request.body.arrival.required - 도착지 주소 정보
 * @param {string} request.body.arrival.zonecode - 우편번호
 * @param {string} request.body.arrival.roadAddress.required - 도로명 주소
 * @param {string} request.body.arrival.jibunAddress - 지번 주소
 * @param {string} request.body.arrival.extraAddress - 추가 주소
 * @param {string} request.body.arrival.detailAddress - 상세 주소
 * @param {string} request.body.movingDate.required - 이사 날짜 (YYYY-MM-DD 형식)
 * @param {boolean} request.body.isDateConfirmed.required - 날짜 확정 여부
 * @param {string} request.body.description - 추가 설명
 * @returns {object} 201 - 견적 요청 생성 성공
 * @returns {object} 400 - 잘못된 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 500 - 서버 내부 오류
 * @example request - 요청 예시
 * {
 *   "movingType": "HOME",
 *   "departure": {
 *     "zonecode": "06123",
 *     "roadAddress": "서울특별시 강남구 테헤란로 123",
 *     "jibunAddress": "서울특별시 강남구 역삼동 123-45",
 *     "extraAddress": "",
 *     "detailAddress": "101호"
 *   },
 *   "arrival": {
 *     "zonecode": "06124",
 *     "roadAddress": "서울특별시 서초구 서초대로 456",
 *     "jibunAddress": "서울특별시 서초구 서초동 456-78",
 *     "extraAddress": "",
 *     "detailAddress": "202호"
 *   },
 *   "movingDate": "2024-02-15",
 *   "isDateConfirmed": true,
 *   "description": "안전하고 신속한 이사 부탁드립니다."
 * }
 * @example response - 201 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 생성되었습니다.",
 *   "data": {
 *     "id": 1,
 *     "userId": 1,
 *     "movingType": "HOME",
 *     "departureAddr": "서울특별시 강남구 테헤란로 123",
 *     "arrivalAddr": "서울특별시 서초구 서초대로 456",
 *     "departureDetail": "101호",
 *     "arrivalDetail": "202호",
 *     "movingDate": "2024-02-15T00:00:00.000Z",
 *     "status": "ACTIVE",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 * @example response - 400 - 잘못된 입력값
 * {
 *   "success": false,
 *   "message": "필수 필드가 누락되었습니다. (movingType, departure, arrival, movingDate)"
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "success": false,
 *   "message": "인증이 필요합니다."
 * }
 */
router.post("/", verifyAccessToken, quoteController.createQuote);

/**
 * GET /quotes/active
 * @summary 활성 견적 요청 조회
 * @description 현재 사용자의 활성 상태인 견적 요청을 조회합니다.
 * @tags Quote
 * @security BearerAuth
 * @returns {object} 200 - 활성 견적 요청 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 500 - 서버 내부 오류
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "활성 견적 요청 조회 성공",
 *   "data": {
 *     "id": 1,
 *     "userId": 1,
 *     "movingType": "HOME",
 *     "departureAddr": "서울특별시 강남구 테헤란로 123",
 *     "arrivalAddr": "서울특별시 서초구 서초대로 456",
 *     "departureDetail": "101호",
 *     "arrivalDetail": "202호",
 *     "movingDate": "2024-02-15T00:00:00.000Z",
 *     "status": "ACTIVE",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z"
 *   }
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
 */
router.get("/active", verifyAccessToken, quoteController.getActiveQuote);

/**
 * PATCH /quotes/active
 * @summary 활성 견적 요청 수정
 * @description 현재 사용자의 활성 견적 요청을 수정합니다.
 * @tags Quote
 * @security BearerAuth
 * @param {object} request.body.required - 수정할 견적 요청 정보
 * @param {string} request.body.movingType - 이사 종류 (SMALL, HOME, OFFICE)
 * @param {object} request.body.departure - 출발지 주소 정보
 * @param {string} request.body.departure.zonecode - 우편번호
 * @param {string} request.body.departure.roadAddress - 도로명 주소
 * @param {string} request.body.departure.jibunAddress - 지번 주소
 * @param {string} request.body.departure.extraAddress - 추가 주소
 * @param {string} request.body.departure.detailAddress - 상세 주소
 * @param {object} request.body.arrival - 도착지 주소 정보
 * @param {string} request.body.arrival.zonecode - 우편번호
 * @param {string} request.body.arrival.roadAddress - 도로명 주소
 * @param {string} request.body.arrival.jibunAddress - 지번 주소
 * @param {string} request.body.arrival.extraAddress - 추가 주소
 * @param {string} request.body.arrival.detailAddress - 상세 주소
 * @param {string} request.body.movingDate - 이사 날짜 (YYYY-MM-DD 형식)
 * @param {boolean} request.body.isDateConfirmed - 날짜 확정 여부
 * @param {string} request.body.description - 추가 설명
 * @returns {object} 200 - 견적 요청 수정 성공
 * @returns {object} 400 - 잘못된 입력값
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 500 - 서버 내부 오류
 * @example request - 요청 예시
 * {
 *   "movingType": "OFFICE",
 *   "departure": {
 *     "zonecode": "06123",
 *     "roadAddress": "서울특별시 강남구 테헤란로 789",
 *     "jibunAddress": "서울특별시 강남구 역삼동 789-12",
 *     "extraAddress": "",
 *     "detailAddress": "3층"
 *   },
 *   "movingDate": "2024-03-01",
 *   "isDateConfirmed": true
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 수정되었습니다.",
 *   "data": {
 *     "id": 1,
 *     "userId": 1,
 *     "movingType": "OFFICE",
 *     "departureAddr": "서울특별시 강남구 테헤란로 789",
 *     "arrivalAddr": "서울특별시 서초구 서초대로 456",
 *     "departureDetail": "3층",
 *     "arrivalDetail": "202호",
 *     "movingDate": "2024-03-01T00:00:00.000Z",
 *     "status": "ACTIVE",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T11:00:00.000Z"
 *   }
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
 * @example response - 404 - 데이터 없음
 * {
 *   "success": false,
 *   "message": "활성 견적 요청이 없습니다."
 * }
 */
router.patch("/active", verifyAccessToken, quoteController.updateActiveQuote);

/**
 * DELETE /quotes/active
 * @summary 활성 견적 요청 취소
 * @description 현재 사용자의 활성 견적 요청을 취소(삭제)합니다.
 * @tags Quote
 * @security BearerAuth
 * @returns {object} 200 - 견적 요청 취소 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 500 - 서버 내부 오류
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 취소되었습니다."
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
 */
router.delete("/active", verifyAccessToken, quoteController.cancelActiveQuote);

export default router;

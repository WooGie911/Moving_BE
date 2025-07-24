import { Router } from "express";
import EstimateRequestController from "../controllers/estimateRequest.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();
const estimateRequestController = new EstimateRequestController();

/**
 * POST / (이사 견적 요청 생성)
 * @summary 이사 견적 요청 생성
 * @description 한 사용자는 PENDING 상태의 견적 요청이 1개만 존재할 수 있습니다. 기존 요청이 CANCELLED, EXPIRED, COMPLETED 상태일 때만 새로 생성할 수 있습니다. 기사님은 견적 요청을 생성할 수 없습니다.
 * @tags EstimateRequest
 * @security BearerAuth
 * @param {object} request.body.required - 견적 요청 정보
 * @param {string} request.body.movingType.required - 이사 종류 (small, home, office)
 * @param {string} request.body.movingDate.required - 이사 날짜 (YYYY-MM-DD 형식, 오늘 이후만 가능)
 * @param {object} request.body.departure.required - 출발지 주소 정보
 * @param {string} request.body.departure.roadAddress.required - 출발지 도로명주소 (예: "서울특별시 강남구 테헤란로 123")
 * @param {string} request.body.departure.detailAddress - 출발지 상세주소 (예: "456호")
 * @param {object} request.body.arrival.required - 도착지 주소 정보
 * @param {string} request.body.arrival.roadAddress.required - 도착지 도로명주소 (예: "경기도 성남시 분당구 판교로 456")
 * @param {string} request.body.arrival.detailAddress - 도착지 상세주소 (예: "789호")
 * @param {string} request.body.description - 추가 설명
 * @returns {object} 201 - 견적 요청 생성 성공
 * @returns {object} 400 - 잘못된 요청 (이사일이 과거, 출발지/도착지 동일 등)
 * @returns {object} 403 - 기사님은 견적 요청을 생성할 수 없음
 * @returns {object} 409 - 이미 진행중인 견적 요청 존재
 * @returns {object} 401 - 인증 실패
 * @returns {object} 500 - 서버 내부 오류
 * @example request - 요청 예시
 * {
 *   "movingType": "home",
 *   "movingDate": "2024-07-01",
 *   "departure": {
 *     "roadAddress": "서울특별시 강남구 테헤란로 123",
 *     "detailAddress": "456호"
 *   },
 *   "arrival": {
 *     "roadAddress": "경기도 성남시 분당구 판교로 456",
 *     "detailAddress": "789호"
 *   },
 *   "description": "엘리베이터 있음, 반려동물 동반"
 * }
 * @example response - 201 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 생성되었습니다.",
 *   "data": {
 *     "id": "abc123",
 *     "movingType": "HOME",
 *     "movingDate": "2024-07-01",
 *     "departureAddress": "서울특별시 강남구 테헤란로 123",
 *     "arrivalAddress": "경기도 성남시 분당구 판교로 456",
 *     "departureDetailAddress": "456호",
 *     "arrivalDetailAddress": "789호",
 *     "description": "엘리베이터 있음, 반려동물 동반"
 *   }
 * }
 * @example response - 400 - 이사일이 과거
 * {
 *   "success": false,
 *   "message": "이사일은 오늘 이후로 설정해주세요."
 * }
 * @example response - 400 - 출발지와 도착지 동일
 * {
 *   "success": false,
 *   "message": "출발지와 도착지는 달라야 합니다."
 * }
 * @example response - 403 - 기사님은 생성 불가
 * {
 *   "success": false,
 *   "message": "기사님은 견적 요청을 생성할 수 없습니다. 일반 고객으로 로그인해주세요."
 * }
 * @example response - 409 - 이미 진행중인 견적 요청이 있습니다.
 * {
 *   "success": false,
 *   "message": "이미 진행중인 견적 요청이 있습니다."
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
router.post("/", verifyAccessToken, estimateRequestController.createEstimateRequest);

/**
 * GET /active (활성 견적 요청 조회)
 * @summary 활성 견적 요청 조회
 * @description 현재 사용자의 활성 상태(PENDING) 견적 요청이 있는지 확인하고, 만료된 요청은 자동으로 EXPIRED로 변경합니다. 기사님은 견적 요청을 조회할 수 없습니다.
 * @tags EstimateRequest
 * @security BearerAuth
 * @returns {object} 200 - 활성 견적 요청 조회 성공
 * @returns {object} 403 - 기사님은 견적 요청을 조회할 수 없음
 * @returns {object} 401 - 인증 실패
 * @returns {object} 500 - 서버 내부 오류
 * @example response - 200 - 활성 견적 요청 있음
 * {
 *   "success": true,
 *   "hasActive": true,
 *   "data": {
 *     "id": "abc123",
 *     "userId": "user123",
 *     "movingType": "HOME",
 *     "departureAddress": "서울특별시 강남구 테헤란로 123",
 *     "arrivalAddress": "경기도 성남시 분당구 판교로 456",
 *     "departureDetailAddress": "456호",
 *     "arrivalDetailAddress": "789호",
 *     "movingDate": "2024-07-01",
 *     "status": "PENDING",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 * @example response - 200 - 활성 견적 요청 없음
 * {
 *   "success": true,
 *   "hasActive": false
 * }
 * @example response - 403 - 기사님은 조회 불가
 * {
 *   "success": false,
 *   "message": "기사님은 견적 요청을 조회할 수 없습니다. 일반 고객으로 로그인해주세요."
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
router.get("/active", verifyAccessToken, estimateRequestController.getActiveEstimateRequest);

/**
 * PATCH /active (활성 견적 요청 수정)
 * @summary 활성 견적 요청 수정
 * @description PENDING 상태이면서 만료되지 않은 견적 요청만 수정 가능. 기사님은 수정할 수 없음.
 * @tags EstimateRequest
 * @security BearerAuth
 * @param {object} request.body.required - 수정할 견적 요청 정보
 * @param {string} request.body.movingType.required - 이사 종류 (small, home, office)
 * @param {string} request.body.movingDate.required - 이사 날짜 (YYYY-MM-DD 형식, 오늘 이후만 가능)
 * @param {object} request.body.departure.required - 출발지 주소 정보
 * @param {string} request.body.departure.roadAddress.required - 출발지 도로명주소 (예: "서울특별시 강남구 테헤란로 123")
 * @param {string} request.body.departure.detailAddress - 출발지 상세주소 (예: "456호")
 * @param {object} request.body.arrival.required - 도착지 주소 정보
 * @param {string} request.body.arrival.roadAddress.required - 도착지 도로명주소 (예: "경기도 성남시 분당구 판교로 456")
 * @param {string} request.body.arrival.detailAddress - 도착지 상세주소 (예: "789호")
 * @param {string} request.body.description - 추가 설명
 * @returns {object} 200 - 견적 요청 수정 성공
 * @returns {object} 400 - 잘못된 요청 (이사일이 과거, 출발지/도착지 동일 등)
 * @returns {object} 403 - 기사님은 견적 요청을 수정할 수 없음
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 409 - 진행중(PENDING) 상태가 아님/만료된 요청 등
 * @returns {object} 401 - 인증 실패
 * @returns {object} 500 - 서버 내부 오류
 * @example request - 요청 예시
 * {
 *   "movingType": "office",
 *   "movingDate": "2024-07-10",
 *   "departure": {
 *     "roadAddress": "서울특별시 강남구 테헤란로 123",
 *     "detailAddress": "456호"
 *   },
 *   "arrival": {
 *     "roadAddress": "경기도 성남시 분당구 판교로 456",
 *     "detailAddress": "789호"
 *   },
 *   "description": "짐이 많음, 사다리차 필요"
 * }
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "견적 요청이 성공적으로 수정되었습니다.",
 *   "data": {
 *     "id": "abc123",
 *     "movingType": "OFFICE",
 *     "movingDate": "2024-07-10",
 *     "departureAddress": "서울특별시 강남구 테헤란로 123",
 *     "arrivalAddress": "경기도 성남시 분당구 판교로 456",
 *     "departureDetailAddress": "456호",
 *     "arrivalDetailAddress": "789호",
 *     "description": "짐이 많음, 사다리차 필요"
 *   }
 * }
 * @example response - 400 - 이사일이 과거
 * {
 *   "success": false,
 *   "message": "이사일은 오늘 이후로 설정해주세요."
 * }
 * @example response - 400 - 출발지와 도착지 동일
 * {
 *   "success": false,
 *   "message": "출발지와 도착지는 달라야 합니다."
 * }
 * @example response - 403 - 기사님은 수정 불가
 * {
 *   "success": false,
 *   "message": "기사님은 견적 요청을 수정할 수 없습니다. 일반 고객으로 로그인해주세요."
 * }
 * @example response - 409 - 진행중(PENDING) 상태가 아님
 * {
 *   "success": false,
 *   "message": "진행중(PENDING) 상태에서만 수정할 수 있습니다."
 * }
 * @example response - 409 - 만료된 요청
 * {
 *   "success": false,
 *   "message": "이사일이 지나 만료된 견적 요청은 수정할 수 없습니다."
 * }
 * @example response - 404 - 활성 견적 요청 없음
 * {
 *   "success": false,
 *   "message": "활성 견적 요청이 없습니다."
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
router.patch("/active", verifyAccessToken, estimateRequestController.updateActiveEstimateRequest);

/**
 * DELETE /active (활성 견적 요청 취소)
 * @summary 활성 견적 요청 취소
 * @description PENDING 상태이면서 만료되지 않은 견적 요청만 취소 가능. 기사님이 견적을 제출한 경우 취소할 수 없습니다. 기사님은 견적 요청을 취소할 수 없습니다. 취소 시 상태는 CANCELLED로 변경됩니다.
 * @tags EstimateRequest
 * @security BearerAuth
 * @returns {object} 200 - 견적 요청 취소 성공
 * @returns {object} 403 - 기사님은 견적 요청을 취소할 수 없음
 * @returns {object} 404 - 활성 견적 요청 없음
 * @returns {object} 409 - 진행중(PENDING) 상태가 아님/기사 견적 제출됨/만료된 요청 등
 * @returns {object} 401 - 인증 실패
 * @returns {object} 500 - 서버 내부 오류
 * @example response - 200 - 취소 성공
 * {
 *   "success": true,
 *   "message": "견적 요청이 취소되었습니다."
 * }
 * @example response - 403 - 기사님은 취소 불가
 * {
 *   "success": false,
 *   "message": "기사님은 견적 요청을 취소할 수 없습니다. 일반 고객으로 로그인해주세요."
 * }
 * @example response - 409 - 진행중(PENDING) 상태가 아님
 * {
 *   "success": false,
 *   "message": "진행중(PENDING) 상태에서만 취소할 수 있습니다."
 * }
 * @example response - 409 - 기사 견적 제출됨
 * {
 *   "success": false,
 *   "message": "기사님이 견적을 제출한 경우 취소할 수 없습니다. 견적을 확인한 후 결정해주세요."
 * }
 * @example response - 409 - 만료된 요청
 * {
 *   "success": false,
 *   "message": "이사일이 지나 만료된 견적 요청은 취소할 수 없습니다."
 * }
 * @example response - 404 - 활성 견적 요청 없음
 * {
 *   "success": false,
 *   "message": "활성 견적 요청이 없습니다."
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
router.delete("/active", verifyAccessToken, estimateRequestController.cancelActiveEstimateRequest);

export default router;

import { Router } from "express";
import EstimateRequestController from "../controllers/estimateRequest.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();
const estimateRequestController = new EstimateRequestController();

/**
 * @swagger
 * components:
 *   schemas:
 *     AddressInfo:
 *       type: object
 *       properties:
 *         roadAddress:
 *           type: string
 *           description: 도로명주소
 *           required: true
 *         detailAddress:
 *           type: string
 *           description: 상세주소
 *         zonecode:
 *           type: string
 *           description: 우편번호 (카카오 API 응답용)
 *         jibunAddress:
 *           type: string
 *           description: 지번주소
 *         extraAddress:
 *           type: string
 *           description: 참고항목
 *       required:
 *         - roadAddress
 *
 *     CreateEstimateRequest:
 *       type: object
 *       properties:
 *         movingType:
 *           type: string
 *           description: 이사 종류
 *           enum: [small, home, office]
 *           required: true
 *         movingDate:
 *           type: string
 *           description: 이사 날짜 (YYYY-MM-DD)
 *           format: date
 *           required: true
 *         isDateConfirmed:
 *           type: boolean
 *           description: 날짜 확정 여부
 *         departure:
 *           $ref: '#/components/schemas/AddressInfo'
 *           required: true
 *         arrival:
 *           $ref: '#/components/schemas/AddressInfo'
 *           required: true
 *         description:
 *           type: string
 *           description: 추가 설명
 *       required:
 *         - movingType
 *         - movingDate
 *         - departure
 *         - arrival
 *
 *     UpdateEstimateRequest:
 *       type: object
 *       properties:
 *         movingType:
 *           type: string
 *           description: 이사 종류
 *           enum: [small, home, office]
 *         movingDate:
 *           type: string
 *           description: 이사 날짜 (YYYY-MM-DD)
 *           format: date
 *         departure:
 *           $ref: '#/components/schemas/AddressInfo'
 *         arrival:
 *           $ref: '#/components/schemas/AddressInfo'
 *         description:
 *           type: string
 *           description: 추가 설명
 *
 *     EstimateRequestResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 견적 요청 ID
 *         userId:
 *           type: string
 *           description: 사용자 ID
 *         movingType:
 *           type: string
 *           description: 이사 종류
 *           enum: [SMALL, HOME, OFFICE]
 *         departureAddress:
 *           type: string
 *           description: 출발지 주소 (한글 지역명 포함)
 *         arrivalAddress:
 *           type: string
 *           description: 도착지 주소 (한글 지역명 포함)
 *         departureDetailAddress:
 *           type: string
 *           description: 출발지 상세주소
 *         arrivalDetailAddress:
 *           type: string
 *           description: 도착지 상세주소
 *         departureZoneCode:
 *           type: string
 *           description: 출발지 우편번호
 *         arrivalZoneCode:
 *           type: string
 *           description: 도착지 우편번호
 *         movingDate:
 *           type: string
 *           description: 이사 날짜
 *           format: date
 *         status:
 *           type: string
 *           description: 견적 요청 상태
 *           enum: [PENDING, CANCELLED, COMPLETED]
 *         createdAt:
 *           type: string
 *           description: 생성일시
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           description: 수정일시
 *           format: date-time
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           $ref: '#/components/schemas/EstimateRequestResponse'
 *           description: 견적 요청 데이터
 *
 *     ActiveResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         hasActive:
 *           type: boolean
 *           description: 활성 견적 요청 존재 여부
 *         data:
 *           $ref: '#/components/schemas/EstimateRequestResponse'
 *           description: 견적 요청 데이터 (hasActive가 true인 경우)
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 에러 메시지
 *
 *     CancelResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 */

// 견적 요청 생성
/**
 * @swagger
 * /estimateRequests/create:
 *   post:
 *     summary: 견적 요청 생성
 *     description: 고객이 이사 견적을 요청합니다. 한 사용자는 PENDING 상태의 견적 요청이 1개만 존재할 수 있습니다. 기사님은 견적 요청을 생성할 수 없습니다. 주소는 자동으로 파싱되어 데이터베이스에 저장되며, zonecode 필드는 postalCode로 자동 변환됩니다.
 *     tags: [EstimateRequest]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEstimateRequest'
 *           examples:
 *             home_moving:
 *               summary: 가정 이사 견적 요청 예시
 *               value:
 *                 movingType: "home"
 *                 movingDate: "2025-07-28"
 *                 isDateConfirmed: true
 *                 departure:
 *                   roadAddress: "부산 연제구 월드컵대로91번가길 15"
 *                   detailAddress: "501호"
 *                   zonecode: "47597"
 *                   jibunAddress: "부산 연제구 연산동 715-1"
 *                   extraAddress: "연산동"
 *                 arrival:
 *                   roadAddress: "경남 고성군 고성읍 송학로 206"
 *                   detailAddress: "402호"
 *                   zonecode: "52940"
 *                   jibunAddress: "경남 고성군 고성읍 송학리 235-2"
 *                   extraAddress: "송학리"
 *                 description: "가정 이사입니다. 신중하게 견적 부탁드립니다."
 *     responses:
 *       201:
 *         description: 견적 요청 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "견적 요청이 성공적으로 생성되었습니다."
 *               data:
 *                 id: "cmdjyt7ei0004irvgm050kzxz"
 *                 userId: "cmdjvqbym0000a4whmdgza4i0"
 *                 movingType: "HOME"
 *                 departureAddress: "부산 연제구 월드컵대로91번가길"
 *                 arrivalAddress: "경남 고성군 고성읍"
 *                 departureDetailAddress: "15 501호"
 *                 arrivalDetailAddress: "송학로 206 402호"
 *                 departureZoneCode: "47597"
 *                 arrivalZoneCode: "52940"
 *                 movingDate: "2025-07-28"
 *                 status: "PENDING"
 *                 createdAt: "2025-07-26T08:05:07.387Z"
 *                 updatedAt: "2025-07-26T08:05:07.387Z"
 *       400:
 *         description: 잘못된 요청 (이사일이 과거, 출발지와 도착지 동일, 잘못된 이사 종류, 주소 누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               past_date:
 *                 summary: 이사일이 과거인 경우
 *                 value:
 *                   success: false
 *                   message: "이사일은 오늘 이후로 설정해주세요."
 *               same_address:
 *                 summary: 출발지와 도착지 동일한 경우
 *                 value:
 *                   success: false
 *                   message: "출발지와 도착지는 달라야 합니다."
 *               invalid_moving_type:
 *                 summary: 잘못된 이사 종류인 경우
 *                 value:
 *                   success: false
 *                   message: "이사 종류는 small, home, office 중 하나여야 합니다."
 *               missing_address:
 *                 summary: 주소 누락인 경우
 *                 value:
 *                   success: false
 *                   message: "출발지 주소는 필수입니다."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *       403:
 *         description: 기사님은 견적 요청을 생성할 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "기사님은 견적 요청을 생성할 수 없습니다. 일반 고객으로 로그인해주세요."
 *       409:
 *         description: 이미 진행중인 견적 요청 존재
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "이미 진행중인 견적 요청이 있습니다."
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다."
 */
router.post("/create", verifyAccessToken, (req, res) => estimateRequestController.createEstimateRequest(req, res));

// 활성 견적 요청 조회
/**
 * @swagger
 * /estimateRequests/active:
 *   get:
 *     summary: 활성 견적 요청 조회
 *     description: 현재 사용자의 활성 상태(PENDING) 견적 요청을 조회합니다. 기사님은 견적 요청을 조회할 수 없습니다. 지역명은 한글로 표시되며, 주소가 soft delete된 경우 undefined로 처리됩니다.
 *     tags: [EstimateRequest]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 활성 견적 요청 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveResponse'
 *             examples:
 *               has_active:
 *                 summary: 활성 견적 요청 있음
 *                 value:
 *                   success: true
 *                   hasActive: true
 *                   data:
 *                     id: "cmdjyt7ei0004irvgm050kzxz"
 *                     userId: "cmdjvqbym0000a4whmdgza4i0"
 *                     movingType: "HOME"
 *                     departureAddress: "부산 연제구 월드컵대로91번가길"
 *                     arrivalAddress: "경남 고성군 고성읍"
 *                     departureDetailAddress: "15 501호"
 *                     arrivalDetailAddress: "송학로 206 402호"
 *                     departureZoneCode: "47597"
 *                     arrivalZoneCode: "52940"
 *                     movingDate: "2025-07-28"
 *                     status: "PENDING"
 *                     createdAt: "2025-07-26T08:05:07.387Z"
 *                     updatedAt: "2025-07-26T08:05:07.387Z"
 *               no_active:
 *                 summary: 활성 견적 요청 없음
 *                 value:
 *                   success: true
 *                   hasActive: false
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *       403:
 *         description: 기사님은 견적 요청을 조회할 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "기사님은 견적 요청을 조회할 수 없습니다. 일반 고객으로 로그인해주세요."
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다."
 */
router.get("/active", verifyAccessToken, (req, res) => estimateRequestController.getActiveEstimateRequest(req, res));

// 견적 요청 수정
/**
 * @swagger
 * /estimateRequests/active:
 *   patch:
 *     summary: 견적 요청 수정
 *     description: PENDING 상태의 견적 요청을 수정합니다. 기사님은 견적 요청을 수정할 수 없습니다. 주소 수정 시 기존 주소는 soft delete되고 새 주소가 생성됩니다. 부분 수정이 가능하며, 필요한 필드만 전송하면 됩니다.
 *     tags: [EstimateRequest]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEstimateRequest'
 *           examples:
 *             change_moving_type:
 *               summary: 이사 종류 변경 예시
 *               value:
 *                 movingType: "home"
 *                 description: "가정 이사로 변경했습니다."
 *             change_moving_date:
 *               summary: 이사일 변경 예시
 *               value:
 *                 movingDate: "2026-10-20"
 *             change_address:
 *               summary: 주소 변경 예시
 *               value:
 *                 departure:
 *                   roadAddress: "서울 강남구 테헤란로 123"
 *                   detailAddress: "456호"
 *                   zonecode: "06123"
 *                   jibunAddress: "서울 강남구 역삼동 123-45"
 *                   extraAddress: "역삼동"
 *                 arrival:
 *                   roadAddress: "경기 성남시 분당구 판교로 456"
 *                   detailAddress: "789호"
 *                   zonecode: "13561"
 *                   jibunAddress: "경기 성남시 분당구 정자동 456-78"
 *                   extraAddress: "정자동"
 *     responses:
 *       200:
 *         description: 견적 요청 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "견적 요청이 성공적으로 수정되었습니다."
 *               data:
 *                 id: "cmdjyt7ei0004irvgm050kzxz"
 *                 userId: "cmdjvqbym0000a4whmdgza4i0"
 *                 movingType: "OFFICE"
 *                 departureAddress: "서울 강남구 테헤란로"
 *                 arrivalAddress: "경기 성남시 분당구 판교로"
 *                 departureDetailAddress: "123 456호"
 *                 arrivalDetailAddress: "456 789호"
 *                 departureZoneCode: "06123"
 *                 arrivalZoneCode: "13561"
 *                 movingDate: "2026-10-20"
 *                 status: "PENDING"
 *                 createdAt: "2025-07-26T08:05:07.387Z"
 *                 updatedAt: "2025-07-26T11:30:00.000Z"
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               past_date:
 *                 summary: 이사일이 과거인 경우
 *                 value:
 *                   success: false
 *                   message: "이사일은 오늘 이후로 설정해주세요."
 *               same_address:
 *                 summary: 출발지와 도착지 동일한 경우
 *                 value:
 *                   success: false
 *                   message: "출발지와 도착지는 달라야 합니다."
 *               invalid_moving_type:
 *                 summary: 잘못된 이사 종류인 경우
 *                 value:
 *                   success: false
 *                   message: "이사 종류는 small, home, office 중 하나여야 합니다."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *       403:
 *         description: 기사님은 견적 요청을 수정할 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "기사님은 견적 요청을 수정할 수 없습니다. 일반 고객으로 로그인해주세요."
 *       404:
 *         description: 활성 견적 요청 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "활성 견적 요청이 없습니다."
 *       409:
 *         description: 수정 불가능한 상태
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_pending:
 *                 summary: 진행중(PENDING) 상태가 아님
 *                 value:
 *                   success: false
 *                   message: "진행중(PENDING) 상태에서만 수정할 수 있습니다."
 *               estimate_submitted:
 *                 summary: 기사 견적 제출됨
 *                 value:
 *                   success: false
 *                   message: "기사님이 견적을 제출한 경우 수정할 수 없습니다. 견적을 확인한 후 결정해주세요."
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다."
 */
router.patch("/active", verifyAccessToken, (req, res) =>
  estimateRequestController.updateActiveEstimateRequest(req, res),
);

// 견적 요청 취소
/**
 * @swagger
 * /estimateRequests/active:
 *   delete:
 *     summary: 견적 요청 취소
 *     description: PENDING 상태의 견적 요청을 취소합니다. 기사님이 견적을 제출한 경우 취소할 수 없습니다. 기사님은 견적 요청을 취소할 수 없습니다. 취소 시 견적 요청과 관련 주소들의 deletedAt에 오늘 날짜가 기록됩니다.
 *     tags: [EstimateRequest]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: 견적 요청 취소 성공
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 *       403:
 *         description: 기사님은 견적 요청을 취소할 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "기사님은 견적 요청을 취소할 수 없습니다. 일반 고객으로 로그인해주세요."
 *       404:
 *         description: 활성 견적 요청 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "활성 견적 요청이 없습니다."
 *       409:
 *         description: 취소 불가능한 상태
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_pending:
 *                 summary: 진행중(PENDING) 상태가 아님
 *                 value:
 *                   success: false
 *                   message: "진행중(PENDING) 상태에서만 취소할 수 있습니다."
 *               estimate_submitted:
 *                 summary: 기사 견적 제출됨
 *                 value:
 *                   success: false
 *                   message: "기사님이 견적을 제출한 경우 취소할 수 없습니다. 견적을 확인한 후 결정해주세요."
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다."
 */
router.delete("/active", verifyAccessToken, (req, res) =>
  estimateRequestController.cancelActiveEstimateRequest(req, res),
);

export default router;

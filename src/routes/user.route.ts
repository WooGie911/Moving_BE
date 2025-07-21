import { Router } from "express";
import {
  getUser,
  postProfile,
  patchMoverBasicInfo,
} from "../controllers/user.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import generatePresignedUrls from "../middlewares/presignedUrl";

const userRouter = Router();

/**
 * User info response
 * @typedef {object} UserInfoResponse
 * @property {boolean} success - 성공 여부
 * @property {object} data - 사용자 정보
 * @property {string} data.id - 사용자 ID
 * @property {string} data.name - 사용자 이름
 * @property {string} data.nickname - 닉네임
 * @property {string} data.customerImage - 고객 프로필 이미지 (CUSTOMER만)
 * @property {string} data.moverImage - 기사님 프로필 이미지 (MOVER만)
 * @property {string} data.userType - 사용자 타입 - enum:CUSTOMER,MOVER
 */

/**
 * Customer profile request
 * @typedef {object} CustomerProfileRequest
 * @property {string} nickname.required - 닉네임
 * @property {string} customerImage - 프로필 이미지 URL
 * @property {string} currentArea.required - 현재 거주 지역 - enum:SEOUL,BUSAN,DAEGU,INCHEON,GWANGJU,DAEJEON,ULSAN,SEJONG,GYEONGGI,GANGWON,CHUNGBUK,CHUNGNAM,JEONBUK,JEONNAM,GYEONGBUK,GYEONGNAM,JEJU
 * @property {array<string>} preferredServices.required - 선호 서비스 타입 - enum:SMALL,HOME,OFFICE
 */

/**
 * Mover profile request
 * @typedef {object} MoverProfileRequest
 * @property {string} nickname.required - 닉네임
 * @property {string} moverImage - 프로필 이미지 URL
 * @property {integer} career.required - 경력 (년)
 * @property {string} shortIntro.required - 한줄 소개 (최소 8자)
 * @property {string} detailIntro.required - 상세 설명 (최소 10자)
 * @property {string} currentArea.required - 현재 활동 지역 - enum:SEOUL,BUSAN,DAEGU,INCHEON,GWANGJU,DAEJEON,ULSAN,SEJONG,GYEONGGI,GANGWON,CHUNGBUK,CHUNGNAM,JEONBUK,JEONNAM,GYEONGBUK,GYEONGNAM,JEJU
 * @property {array<string>} serviceTypes.required - 제공 서비스 타입 - enum:SMALL,HOME,OFFICE
 */

/**
 * Mover basic info update request
 * @typedef {object} MoverBasicInfoRequest
 * @property {string} name - 이름
 * @property {string} phoneNumber - 전화번호 (10-11자리 숫자)
 * @property {string} currentPassword - 현재 비밀번호
 * @property {string} newPassword - 새 비밀번호 (최소 8자)
 */

/**
 * Success response
 * @typedef {object} SuccessResponse
 * @property {boolean} success - 성공 여부
 * @property {string} message - 응답 메시지
 * @property {object} data - 응답 데이터 (선택사항)
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {integer} status - HTTP 상태 코드
 * @property {string} message - 에러 메시지
 */

/**
 * GET /users
 * @summary 사용자 정보 조회
 * @description 로그인한 사용자의 기본 정보를 조회합니다. 사용자 타입에 따라 다른 필드가 반환됩니다.
 * @tags Users
 * @security BearerAuth
 * @return {UserInfoResponse} 200 - 사용자 정보 조회 성공
 * @return {ErrorResponse} 401 - 인증 실패 (유효하지 않은 토큰)
 * @return {ErrorResponse} 404 - 사용자를 찾을 수 없음
 * @return {ErrorResponse} 500 - 서버 내부 오류
 * @example response - 200 - 고객 정보 조회 성공 응답 예시
 * {
 *   "success": true,
 *   "data": {
 *     "id": "cmd123...",
 *     "name": "김고객",
 *     "nickname": "서울고객",
 *     "customerImage": "https://example.com/customer.jpg",
 *     "userType": "CUSTOMER"
 *   }
 * }
 * @example response - 200 - 기사님 정보 조회 성공 응답 예시
 * {
 *   "success": true,
 *   "data": {
 *     "id": "cmd456...",
 *     "name": "김기사",
 *     "nickname": "서울이사",
 *     "moverImage": "https://example.com/mover.jpg",
 *     "userType": "MOVER"
 *   }
 * }
 */
userRouter.get("/", verifyAccessToken, getUser);

/**
 * POST /users/profile
 * @summary 프로필 등록
 * @description 사용자 타입에 따라 고객 또는 기사님 프로필을 등록합니다. 토큰의 userType에 따라 자동으로 처리됩니다.
 * @tags Users
 * @security BearerAuth
 * @param {CustomerProfileRequest|MoverProfileRequest} request.body.required - 프로필 정보 (사용자 타입에 따라 다름)
 * @return {SuccessResponse} 200 - 프로필 등록 성공
 * @return {ErrorResponse} 400 - 유효하지 않은 사용자 역할
 * @return {ErrorResponse} 401 - 인증 실패 (유효하지 않은 토큰)
 * @return {ErrorResponse} 404 - 사용자를 찾을 수 없음
 * @return {ErrorResponse} 422 - 유효성 검사 실패 (필수 필드 누락, 닉네임 중복, 입력값 형식 오류)
 * @return {ErrorResponse} 500 - 서버 내부 오류
 * @example request - 고객 프로필 등록 요청 예시
 * {
 *   "nickname": "서울고객",
 *   "customerImage": "https://example.com/profile.jpg",
 *   "currentArea": "SEOUL",
 *   "preferredServices": ["SMALL", "HOME", "OFFICE"]
 * }
 * @example request - 기사님 프로필 등록 요청 예시
 * {
 *   "nickname": "서울이사",
 *   "moverImage": "https://example.com/mover-profile.jpg",
 *   "career": 5,
 *   "shortIntro": "안전하고 빠른 이사를 약속드립니다",
 *   "detailIntro": "5년 경력의 전문 이사 기사입니다. 소형 이사부터 대형 이사까지 모든 종류의 이사를 담당합니다.",
 *   "currentArea": "SEOUL",
 *   "serviceTypes": ["SMALL", "HOME", "OFFICE"]
 * }
 * @example response - 200 - 프로필 등록 성공 응답 예시
 * {
 *   "success": true,
 *   "message": "프로필이 성공적으로 등록되었습니다.",
 *   "data": {
 *     "id": "cmd789...",
 *     "nickname": "서울이사",
 *     "hasProfile": true
 *   }
 * }
 * @example response - 422 - 닉네임 중복 응답 예시
 * {
 *   "status": 422,
 *   "message": "이미 사용중인 닉네임입니다"
 * }
 * @example response - 422 - 필수 필드 누락 응답 예시
 * {
 *   "status": 422,
 *   "message": "닉네임을 입력해주세요"
 * }
 * @example response - 422 - 현재 지역 누락 응답 예시
 * {
 *   "status": 422,
 *   "message": "현재 활동 지역을 선택해주세요"
 * }
 * @example response - 422 - 서비스 타입 누락 응답 예시
 * {
 *   "status": 422,
 *   "message": "제공할 서비스를 하나 이상 선택해주세요"
 * }
 */
userRouter.post("/profile", verifyAccessToken, postProfile);

/**
 * PATCH /users/profile/mover/basic
 * @summary 기사님 기본정보 수정
 * @description 기사님의 이름, 전화번호, 비밀번호를 수정합니다. 비밀번호 변경 시 현재 비밀번호 확인이 필요합니다.
 * @tags Users
 * @security BearerAuth
 * @param {MoverBasicInfoRequest} request.body.required - 수정할 기본정보
 * @return {SuccessResponse} 200 - 기본정보 수정 성공
 * @return {ErrorResponse} 401 - 인증 실패 (유효하지 않은 토큰)
 * @return {ErrorResponse} 404 - 사용자를 찾을 수 없음
 * @return {ErrorResponse} 422 - 유효성 검사 실패 (현재 비밀번호 불일치, 입력값 형식 오류)
 * @return {ErrorResponse} 500 - 서버 내부 오류
 * @example request - 기본정보 수정 요청 예시
 * {
 *   "name": "김기사수정",
 *   "phoneNumber": "01087654321",
 *   "currentPassword": "현재비밀번호123!",
 *   "newPassword": "새비밀번호456!"
 * }
 * @example response - 200 - 기본정보 수정 성공 응답 예시
 * {
 *   "success": true,
 *   "message": "기사님 기본정보가 성공적으로 수정되었습니다."
 * }
 * @example response - 422 - 현재 비밀번호 불일치 응답 예시
 * {
 *   "status": 422,
 *   "message": "현재 비밀번호가 일치하지 않습니다"
 * }
 * @example response - 422 - 전화번호 형식 오류 응답 예시
 * {
 *   "status": 422,
 *   "message": "전화번호는 10-11자리 숫자로 입력해주세요"
 * }
 */
userRouter.patch(
  "/profile/mover/basic",
  verifyAccessToken,
  patchMoverBasicInfo
);

/**
 * POST /users/profile/presignedUrl
 * @summary 이미지 업로드용 Presigned URL 생성
 * @description S3에 이미지를 업로드하기 위한 Presigned URL을 생성합니다.
 * @tags Users
 * @security BearerAuth
 * @return {SuccessResponse} 200 - Presigned URL 생성 성공
 * @return {ErrorResponse} 401 - 인증 실패 (유효하지 않은 토큰)
 * @return {ErrorResponse} 500 - 서버 내부 오류
 */
userRouter.post(
  "/profile/presignedUrl",
  verifyAccessToken,
  generatePresignedUrls
);

export default userRouter;

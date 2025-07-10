import { Router } from "express";
import {
  signin,
  signup,
  logout,
  refresh,
} from "../controllers/auth.controller";

const authRouter = Router();

/**
 * User signup request
 * @typedef {object} SignupRequest
 * @property {string} name.required - 사용자 이름
 * @property {string} email.required - 이메일 주소
 * @property {string} phoneNumber.required - 전화번호
 * @property {string} password.required - 비밀번호
 * @property {string} currentRole.required - 사용자 역할 - enum:CUSTOMER,MOVER
 */

/**
 * User signin request
 * @typedef {object} SigninRequest
 * @property {string} email.required - 이메일 주소
 * @property {string} password.required - 비밀번호
 */

/**
 * Success response
 * @typedef {object} SuccessResponse
 * @property {number} status - 상태 코드
 * @property {string} message - 응답 메시지
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {number} status - 상태 코드
 * @property {string} message - 에러 메시지
 * @property {string} error - 에러 타입
 */

/**
 * Logout request
 * @typedef {object} LogoutRequest
 * @property {string} refreshToken.required - 리프레시 토큰
 */

/**
 * Refresh token request
 * @typedef {object} RefreshTokenRequest
 * @property {string} refreshToken.required - 리프레시 토큰
 */

// 로그인 엔드포인트
/**
 * POST /auth/sign-in
 * @summary 사용자 로그인
 * @description 이메일과 비밀번호를 통해 사용자 로그인을 진행합니다. 성공 시 HTTP-only 쿠키에 액세스 토큰과 리프레시 토큰을 설정합니다.
 * @tags Auth
 * @param {SigninRequest} request.body.required - 로그인 정보
 * @return {SuccessResponse} 200 - 로그인 성공
 * @return {ErrorResponse} 400 - 기본 입력값 검증 실패 (이메일, 비밀번호 누락)
 * @return {ErrorResponse} 401 - 인증 실패 (존재하지 않는 유저, 비밀번호 불일치)
 * @return {ErrorResponse} 422 - 유효성 검사 실패 (이메일/비밀번호 형식 오류)
 * @return {ErrorResponse} 500 - 서버 내부 오류 (데이터베이스 오류, 비밀번호 검증 오류, 토큰 생성 오류)
 * @example request - 로그인 요청 예시
 * {
 *   "email": "test@test.com",
 *   "password": "1rhdiddl!"
 * }
 * @example response - 200 - 로그인 성공 응답 예시
 * {
 *   "status": 200,
 *   "message": "로그인 성공"
 * }
 * @example response - 400 - 입력값 누락 응답 예시
 * {
 *   "status": 400,
 *   "message": "이메일과 비밀번호를 모두 입력해주세요",
 *   "error": "ValidationError"
 * }
 * @example response - 401 - 인증 실패 응답 예시
 * {
 *   "status": 401,
 *   "message": "존재하지 않는 유저입니다",
 *   "error": "AuthenticationError"
 * }
 * @example response - 422 - 유효성 검사 실패 응답 예시
 * {
 *   "status": 422,
 *   "message": "로그인 정보가 올바르지 않습니다",
 *   "error": "ValidationError"
 * }
 * @example response - 500 - 서버 오류 응답 예시
 * {
 *   "status": 500,
 *   "message": "사용자 조회 중 오류가 발생했습니다",
 *   "error": "DatabaseError"
 * }
 */
authRouter.post("/sign-in", signin);

// 회원가입 엔드포인트
/**
 * POST /auth/sign-up
 * @summary 사용자 회원가입
 * @description 새로운 사용자를 등록합니다. 이메일 중복 확인 후 계정을 생성하고, HTTP-only 쿠키에 토큰을 설정합니다.
 * @tags Auth
 * @param {SignupRequest} request.body.required - 회원가입 정보
 * @return {SuccessResponse} 200 - 회원가입 성공
 * @return {ErrorResponse} 400 - 기본 입력값 검증 실패 (필수 필드 누락)
 * @return {ErrorResponse} 422 - 유효성 검사 실패 (이메일 중복, 입력값 형식 오류)
 * @return {ErrorResponse} 500 - 서버 내부 오류 (데이터베이스 오류, 암호화 오류, 토큰 생성 오류)
 * @example request - 회원가입 요청 예시
 * {
 *   "name": "김철수",
 *   "email": "test@test.com",
 *   "phoneNumber": "01012345678",
 *   "password": "1rhdiddl!",
 *   "currentRole": "CUSTOMER"
 * }
 * @example response - 200 - 회원가입 성공 응답 예시
 * {
 *   "status": 200,
 *   "message": "회원가입 성공"
 * }
 * @example response - 400 - 입력값 누락 응답 예시
 * {
 *   "status": 400,
 *   "message": "필수 정보를 모두 입력해주세요",
 *   "error": "ValidationError"
 * }
 * @example response - 422 - 이메일 중복 응답 예시
 * {
 *   "status": 422,
 *   "message": "이미 존재하는 이메일입니다",
 *   "error": "ValidationError"
 * }
 * @example response - 422 - 유효성 검사 실패 응답 예시
 * {
 *   "status": 422,
 *   "message": "회원가입 정보가 올바르지 않습니다",
 *   "error": "ValidationError"
 * }
 * @example response - 500 - 데이터베이스 오류 응답 예시
 * {
 *   "status": 500,
 *   "message": "이메일 중복 확인 중 오류가 발생했습니다",
 *   "error": "DatabaseError"
 * }
 * @example response - 500 - 암호화 오류 응답 예시
 * {
 *   "status": 500,
 *   "message": "비밀번호 암호화 중 오류가 발생했습니다",
 *   "error": "ServerError"
 * }
 */
authRouter.post("/sign-up", signup);

// 로그아웃 엔드포인트
/**
 * POST /auth/logout
 * @summary 사용자 로그아웃
 * @description 사용자 로그아웃을 처리합니다. 액세스 토큰을 검증하고 리프레시 토큰을 무효화하며 쿠키를 제거합니다.
 * @tags Auth
 * @security BearerAuth
 * @param {LogoutRequest} request.body - 로그아웃 정보 (빈 객체)
 * @return {SuccessResponse} 200 - 로그아웃 성공
 * @return {ErrorResponse} 401 - 유효하지 않은 액세스 토큰
 * @return {ErrorResponse} 500 - 서버 내부 오류
 * @example request - 로그아웃 요청 예시 (Authorization 헤더 필요)
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * {}
 * @example response - 200 - 로그아웃 성공 응답 예시
 * {
 *   "status": 200,
 *   "message": "로그아웃 성공"
 * }
 */
// TODO: 토큰 검사 필요
authRouter.post("/logout", logout);

// refresh token 갱신 엔드포인트
/**
 * POST /auth/refresh-token
 * @summary 액세스 토큰 갱신
 * @description 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.
 * @tags Auth
 * @param {RefreshTokenRequest} request.body.required - 토큰 갱신 정보
 * @return {SuccessResponse} 200 - 토큰 갱신 성공
 * @return {ErrorResponse} 400 - 유효하지 않은 리프레시 토큰
 * @return {ErrorResponse} 401 - 만료된 리프레시 토큰
 * @return {ErrorResponse} 500 - 서버 내부 오류
 * @example request - 토큰 갱신 요청 예시
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * @example response - 200 - 토큰 갱신 성공 응답 예시
 * {
 *   "status": 200,
 *   "message": "토큰 갱신 성공"
 * }
 */
// TODO: 토큰 검사 필요
authRouter.post("/refresh-token", refresh);

export default authRouter;

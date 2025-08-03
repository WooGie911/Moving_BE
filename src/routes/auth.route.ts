import { Router } from "express";
import {
  postSignin,
  postSignup,
  postLogout,
  postRefresh,
  getGoogleCallback,
  getKakaoCallback,
  getNaverCallback,
  postSwitchRole,
} from "../controllers/auth.controller";
import {
  verifyAccessToken,
  verifyRefreshToken,
} from "../middlewares/verifyToken";
import passport from "passport";
import { TUserRole } from "../types/user.types";

const authRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SignupRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 사용자 이름
 *           required: true
 *         email:
 *           type: string
 *           description: 이메일 주소
 *           format: email
 *           required: true
 *         phoneNumber:
 *           type: string
 *           description: 전화번호
 *           required: true
 *         password:
 *           type: string
 *           description: 비밀번호
 *           required: true
 *         userType:
 *           type: string
 *           description: 사용자 역할
 *           enum: [CUSTOMER, MOVER]
 *           required: true
 *       required:
 *         - name
 *         - email
 *         - phoneNumber
 *         - password
 *         - userType
 *
 *     SigninRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: 이메일 주소
 *           format: email
 *           required: true
 *         password:
 *           type: string
 *           description: 비밀번호
 *           required: true
 *         userType:
 *           type: string
 *           description: 사용자 역할
 *           enum: [CUSTOMER, MOVER]
 *           required: true
 *       required:
 *         - email
 *         - password
 *         - userType
 *
 *     AuthSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *
 *     AuthErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 에러 메시지
 *         error:
 *           type: string
 *           description: 에러 타입
 *
 *     LogoutRequest:
 *       type: object
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: 리프레시 토큰
 *           required: true
 *       required:
 *         - refreshToken
 *
 *     RefreshTokenRequest:
 *       type: object
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: 리프레시 토큰
 *           required: true
 *       required:
 *         - refreshToken
 */

// 로그인 엔드포인트
/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: 사용자 로그인
 *     description: 이메일과 비밀번호를 통해 사용자 로그인을 진행합니다. 성공 시 HTTP-only 쿠키에 액세스 토큰과 리프레시 토큰을 설정합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SigninRequest'
 *           examples:
 *             customer_login:
 *               summary: 고객 로그인 예시
 *               value:
 *                 email: "gksktl111@naver.com"
 *                 password: "1rhdiddl!"
 *                 userType: "CUSTOMER"
 *             mover_login:
 *               summary: 기사님 로그인 예시
 *               value:
 *                 email: "mover@example.com"
 *                 password: "password123"
 *                 userType: "MOVER"
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             example:
 *               success: true
 *               message: "로그인 성공"
 *       400:
 *         description: 기본 입력값 검증 실패 (이메일, 비밀번호 누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               status: 400
 *               success: false
 *               message: "이메일과 비밀번호를 모두 입력해주세요"
 *               error: "ValidationError"
 *       401:
 *         description: 인증 실패 (존재하지 않는 유저, 비밀번호 불일치)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               status: 401
 *               success: false
 *               message: "존재하지 않는 유저입니다"
 *               error: "AuthenticationError"
 *       422:
 *         description: 유효성 검사 실패 (이메일/비밀번호 형식 오류)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               status: 422
 *               success: false
 *               message: "이메일 형식이 올바르지 않습니다"
 *               error: "ValidationError"
 *       500:
 *         description: 서버 내부 오류 (데이터베이스 오류, 비밀번호 검증 오류, 토큰 생성 오류)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               status: 500
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다"
 *               error: "InternalServerError"
 */
authRouter.post("/sign-in", postSignin);

// 회원가입 엔드포인트
/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: 사용자 회원가입
 *     description: 새로운 사용자를 등록합니다. 이메일 중복 확인 후 계정을 생성하고, HTTP-only 쿠키에 토큰을 설정합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *           examples:
 *             customer_signup:
 *               summary: 고객 회원가입 예시
 *               value:
 *                 name: "김철수"
 *                 email: "test@test.com"
 *                 phoneNumber: "01012345678"
 *                 password: "1rhdiddl!"
 *                 userType: "CUSTOMER"
 *             mover_signup:
 *               summary: 기사님 회원가입 예시
 *               value:
 *                 name: "박기사"
 *                 email: "mover@example.com"
 *                 phoneNumber: "01087654321"
 *                 password: "password123"
 *                 userType: "MOVER"
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             example:
 *               success: true
 *               message: "회원가입 성공"
 *       400:
 *         description: 기본 입력값 검증 실패 (필수 필드 누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               status: 400
 *               success: false
 *               message: "필수 정보를 모두 입력해주세요"
 *               error: "ValidationError"
 *       422:
 *         description: 유효성 검사 실패 (이메일 중복, 입력값 형식 오류)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             examples:
 *               duplicate_email:
 *                 summary: 이메일 중복 응답 예시
 *                 value:
 *                   status: 422
 *                   success: false
 *                   message: "이미 존재하는 이메일입니다"
 *                   error: "ValidationError"
 *               validation_error:
 *                 summary: 유효성 검사 실패 응답 예시
 *                 value:
 *                   status: 422
 *                   success: false
 *                   message: "회원가입 정보가 올바르지 않습니다"
 *                   error: "ValidationError"
 *       500:
 *         description: 서버 내부 오류 (데이터베이스 오류, 암호화 오류, 토큰 생성 오류)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               status: 500
 *               success: false
 *               message: "이메일 중복 확인 중 오류가 발생했습니다"
 *               error: "DatabaseError"
 * @example response - 500 - 암호화 오류 응답 예시
 * {
 *   "status": 500,
 *   "success": false,
 *   "message": "비밀번호 암호화 중 오류가 발생했습니다",
 *   "error": "ServerError"
 * }
 */
authRouter.post("/sign-up", postSignup);

// 로그아웃 엔드포인트
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 사용자 로그아웃
 *     description: 사용자 로그아웃을 처리합니다. 액세스 토큰을 검증하고 리프레시 토큰을 무효화하며 쿠키를 제거합니다.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             example:
 *               success: true
 *               message: "로그아웃 성공"
 *       401:
 *         description: 유효하지 않은 액세스 토큰
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "유효하지 않은 액세스 토큰입니다"
 *               error: "UnauthorizedError"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다"
 *               error: "InternalServerError"
 */
authRouter.post("/logout", verifyAccessToken, postLogout);

// role 변경 엔드포인트
/**
 * @swagger
 * /auth/switch-role:
 *   post:
 *     summary: 간단 로그인 역할 변경
 *     description: 간단 로그인 역할을 변경합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 */

authRouter.post("/switch-role", verifyAccessToken, postSwitchRole);

// refresh token 갱신 엔드포인트
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: 액세스 토큰 갱신
 *     description: 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다 (리프레쉬 토큰의 유효기간이 발급 만료 시간에 해당할 경우 리프레시 토큰도 갱신).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             example:
 *               success: true
 *               message: "토큰 갱신 성공"
 *       401:
 *         description: 토큰 관련 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             examples:
 *               invalid_token:
 *                 summary: 유효하지 않은 리프레시 토큰
 *                 value:
 *                   status: 401
 *                   success: false
 *                   message: "Refresh token이 변조되었거나 잘못된 형식입니다. 다시 로그인해 주세요."
 *                   error: "JsonWebTokenError"
 *               expired_token:
 *                 summary: 만료된 리프레시 토큰
 *                 value:
 *                   status: 401
 *                   success: false
 *                   message: "리프레시 토큰 만료 시간이 지났습니다. 다시 로그인해 주세요."
 *                   error: "TokenExpiredError"
 *               no_token:
 *                 summary: 토큰이 없을 경우
 *                 value:
 *                   status: 401
 *                   success: false
 *                   message: "로그인이 필요합니다."
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               status: 500
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다"
 *               error: "InternalServerError"
 */
authRouter.post("/refresh-token", verifyRefreshToken, postRefresh);

// 구글 로그인 콜백 엔드포인트
/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: 구글 로그인 콜백
 *     description: 구글 로그인을 처리합니다. 구글 로그인 후 토큰을 발급합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 구글 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             example:
 *               success: true
 *               message: "구글 로그인 성공"
 *       401:
 *         description: 구글 로그인 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "구글 로그인에 실패했습니다"
 *               error: "AuthenticationError"
 */
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  getGoogleCallback
);

// 구글 로그인 엔드포인트
/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: 구글 로그인 시작
 *     description: 구글 로그인을 시작합니다. userType을 쿼리로 받아 구글 로그인 리디렉션을 시작합니다.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, MOVER]
 *         required: true
 *         description: 사용자 역할 (CUSTOMER 또는 MOVER)
 *     responses:
 *       302:
 *         description: 구글 로그인 페이지로 리디렉션
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "유효한 userType 파라미터가 필요합니다. (CUSTOMER 또는 MOVER)"
 */
authRouter.get("/google", (req, res, next) => {
  const userType = req.query.userType as TUserRole;

  // userType이 없으면 에러 처리
  if (!userType || (userType !== "CUSTOMER" && userType !== "MOVER")) {
    return res.status(400).json({
      success: false,
      message: "유효한 userType 파라미터가 필요합니다. (CUSTOMER 또는 MOVER)",
    });
  }

  // state에 userType 포함해서 Google로 보내기
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: JSON.stringify({ userType }), // 👈 여기서 state 설정
    session: false,
  })(req, res, next);
});

// 카카오 로그인 콜백 엔드포인트
/**
 * @swagger
 * /auth/kakao/callback:
 *   get:
 *     summary: 카카오 로그인 콜백
 *     description: 카카오 로그인을 처리합니다. 카카오 로그인 후 토큰을 발급합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 카카오 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             example:
 *               success: true
 *               message: "카카오 로그인 성공"
 *       401:
 *         description: 카카오 로그인 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "카카오 로그인에 실패했습니다"
 *               error: "AuthenticationError"
 */
authRouter.get(
  "/kakao/callback",
  passport.authenticate("kakao", { session: false }),
  getKakaoCallback
);

//카카오 로그인 엔드 포인트
/**
 * @swagger
 * /auth/kakao:
 *   get:
 *     summary: 카카오 로그인 시작
 *     description: 카카오 로그인을 시작합니다. userType을 쿼리로 받아 카카오 로그인 리디렉션을 시작합니다.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, MOVER]
 *         required: true
 *         description: 사용자 역할 (CUSTOMER 또는 MOVER)
 *     responses:
 *       302:
 *         description: 카카오 로그인 페이지로 리디렉션
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "유효한 userType 파라미터가 필요합니다. (CUSTOMER 또는 MOVER)"
 */
authRouter.get("/kakao", (req, res, next) => {
  const userType = req.query.userType as TUserRole;

  // userType이 없으면 에러 처리
  if (!userType || (userType !== "CUSTOMER" && userType !== "MOVER")) {
    return res.status(400).json({
      success: false,
      message: "유효한 userType 파라미터가 필요합니다. (CUSTOMER 또는 MOVER)",
    });
  }

  // state에 userType 포함해서 Kakao로 보내기
  passport.authenticate("kakao", {
    scope: ["profile_nickname", "account_email"],
    state: JSON.stringify({ userType }), // 👈 여기서 state 설정
    session: false,
  })(req, res, next);
});

// ✅ 네이버 로그인 시작 엔드포인트
/**
 * @swagger
 * /auth/naver:
 *   get:
 *     summary: 네이버 로그인 시작
 *     description: userType을 쿼리로 받아 네이버 로그인 리디렉션을 시작합니다.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, MOVER]
 *         required: true
 *         description: 사용자 역할 (CUSTOMER 또는 MOVER)
 *     responses:
 *       302:
 *         description: 네이버 로그인 페이지로 리디렉션
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "유효한 userType 파라미터가 필요합니다. (CUSTOMER 또는 MOVER)"
 */
authRouter.get("/naver", (req, res, next) => {
  const userType = req.query.userType as TUserRole;

  if (!userType || (userType !== "CUSTOMER" && userType !== "MOVER")) {
    return res.status(400).json({
      success: false,
      message: "유효한 userType 파라미터가 필요합니다. (CUSTOMER 또는 MOVER)",
    });
  }

  // ✅ state에 userType을 JSON으로 인코딩하여 포함
  const encodedState = encodeURIComponent(JSON.stringify({ userType }));

  passport.authenticate("naver", {
    scope: ["profile", "email"], // 네이버는 "nickname" 아닌 "profile"
    state: encodedState, // 👈 핵심
    session: false,
  })(req, res, next);
});

// ✅ 네이버 로그인 콜백 엔드포인트
/**
 * @swagger
 * /auth/naver/callback:
 *   get:
 *     summary: 네이버 로그인 콜백
 *     description: 네이버 로그인 완료 후 콜백을 처리합니다. 토큰을 발급합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 네이버 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 accessToken:
 *                   type: string
 *                   description: 액세스 토큰
 *                 refreshToken:
 *                   type: string
 *                   description: 리프레시 토큰
 *             example:
 *               success: true
 *               accessToken: "eyJhbGci..."
 *               refreshToken: "eyJhbGci..."
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "네이버 로그인에 실패했습니다."
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다."
 */
authRouter.get(
  "/naver/callback",
  passport.authenticate("naver", { session: false }), // ✅ JWT 기반이므로 session: false
  getNaverCallback // 👈 이 핸들러 안에서 JWT 발급 처리
);

export default authRouter;

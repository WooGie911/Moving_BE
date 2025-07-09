import { Router } from "express";
import {
  signin,
  signup,
  logout,
  refresh,
} from "../controllers/auth.controller";

const authRouter = Router();

// 로그인 엔드포인트
/**
 * POST /auth/sign-in
 * @summary 로그인
 * @tags Auth
 * @param {object} request.body.required - 로그인 정보
 * @param {string} request.body.email.required - 이메일
 * @param {string} request.body.password.required - 비밀번호
 * @return {object} 200 - 로그인 성공
 * @return {object} 400 - 로그인 실패
 */
authRouter.post("/sign-in", signin);

// 회원가입 엔드포인트
/**
 * POST /auth/sign-up
 * @summary 회원가입
 * @tags Auth
 * @param {object} request.body.required - 회원가입 정보
 * @param {string} request.body.email.required - 이메일
 * @param {string} request.body.password.required - 비밀번호
 * @param {string} request.body.name.required - 이름
 * @return {object} 200 - 회원가입 성공
 * @return {object} 400 - 회원가입 실패
 */
authRouter.post("/sign-up", signup);

// 로그아웃 엔드포인트
/**
 * POST /auth/logout
 * @summary 로그아웃
 * @tags Auth
 * @return {object} 200 - 로그아웃 성공
 * @return {object} 400 - 로그아웃 실패
 */
// TODO: 토큰 검사 필요
authRouter.post("/logout", logout);

// refresh token 갱신 엔드포인트
/**
 * POST /auth/refresh-token
 * @summary refresh token 갱신
 * @tags Auth
 * @return {object} 200 - refresh token 갱신 성공
 * @return {object} 400 - refresh token 갱신 실패
 */
// TODO: 토큰 검사 필요
authRouter.post("/refresh-token", refresh);

export default authRouter;

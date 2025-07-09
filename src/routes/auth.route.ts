import { Router } from "express";
import {
  signin,
  signup,
  logout,
  refresh,
} from "../controllers/auth.controller";

const authRouter = Router();

// 로그인 요청
authRouter.post("/sign-in", signin);

// 회원가입 요청
authRouter.post("/sign-up", signup);

// 로그아웃 요청
// TODO: 토큰 검사 필요
authRouter.post("/logout", logout);

// refresh token 갱신
// TODO: 토큰 검사 필요
authRouter.post("/refresh-token", refresh);

export default authRouter;

import { Router } from "express";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import { getCSRFToken, getCSRFTokenStats } from "../middlewares/csrfMiddleware";

const authIndexRoutes = Router();

// CSRF 토큰 관련 라우터
authIndexRoutes.get("/csrf-token", getCSRFToken);
authIndexRoutes.get("/csrf-stats", getCSRFTokenStats);

// 인증 관련 라우터
authIndexRoutes.use("/auth", authRouter);
authIndexRoutes.use("/users", userRouter);

export default authIndexRoutes;

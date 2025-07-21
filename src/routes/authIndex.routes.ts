import { Router } from "express";
import authRouter from "./auth.route";
import userRouter from "./user.route";

const authIndexRoutes = Router();

// 인증 관련 라우터
authIndexRoutes.use("/auth", authRouter);
authIndexRoutes.use("/users", userRouter);

export default authIndexRoutes;

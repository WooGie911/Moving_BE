import { Router } from "express";
import { getUser } from "../controllers/user.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const userRouter = Router();

userRouter.get("/", verifyAccessToken, getUser);

export default userRouter;

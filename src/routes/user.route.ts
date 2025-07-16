import { Router } from "express";
import {
  getUser,
  patchUserProfile,
  postUserProfile,
} from "../controllers/user.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const userRouter = Router();

userRouter.get("/", verifyAccessToken, getUser);
userRouter.post("/profile", verifyAccessToken, postUserProfile);
userRouter.patch("/profile", verifyAccessToken, patchUserProfile);

export default userRouter;

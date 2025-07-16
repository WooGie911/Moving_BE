import { Router } from "express";
import {
  getUser,
  patchCustomerProfile,
  postUserProfile,
} from "../controllers/user.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const userRouter = Router();

userRouter.get("/", verifyAccessToken, getUser);
userRouter.post("/profile", verifyAccessToken, postUserProfile);
userRouter.patch("/profile/customer", verifyAccessToken, patchCustomerProfile);

export default userRouter;

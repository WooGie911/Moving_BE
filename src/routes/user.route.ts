import { Router } from "express";
import {
  getUser,
  patchCustomerProfile,
  postUserProfile,
  patchMoverBasicInfo,
} from "../controllers/user.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import generatePresignedUrls from "../middlewares/presignedUrl";

const userRouter = Router();

userRouter.get("/", verifyAccessToken, getUser);
userRouter.post("/profile", verifyAccessToken, postUserProfile);
userRouter.patch("/profile/customer", verifyAccessToken, patchCustomerProfile);
userRouter.patch("/profile/mover/basic", verifyAccessToken, patchMoverBasicInfo);
userRouter.post(
  "/profile/presignedUrl",
  verifyAccessToken,
  generatePresignedUrls
);

export default userRouter;

import { Router } from "express";
import notificationController from "../controllers/notification.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const notificationRouter = Router();

// 알림 목록 조회
notificationRouter.get(
  "/",
  verifyAccessToken,
  notificationController.getNotifications
);

export default notificationRouter;

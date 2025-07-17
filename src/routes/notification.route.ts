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
// 알림 읽음 처리
notificationRouter.patch(
  "/:notificationId/read",
  verifyAccessToken,
  notificationController.readNotification
);
// 전체 알림 읽음 처리
notificationRouter.patch(
  "/read-all",
  verifyAccessToken,
  notificationController.readAllNotifications
);

export default notificationRouter;

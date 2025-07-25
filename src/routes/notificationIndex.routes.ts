import { Router } from "express";
import notificationRouter from "./notification.route";
import sseRouter from "./sse.route";
import actionTestRouter from "./actionTest.route";

const notificationIndexRoutes = Router();

// 알림 관련 라우터
notificationIndexRoutes.use("/notifications", notificationRouter);
notificationIndexRoutes.use("/sse/notifications", sseRouter);
notificationIndexRoutes.use("/actions", actionTestRouter);

export default notificationIndexRoutes;

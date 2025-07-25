import { Request, Response, Router } from "express";
import { registerSSE } from "../utils/emitNotificationSSE";
import { verifyAccessToken } from "../middlewares/verifyToken";

const sseRouter = Router();

/**
 * GET /sse/notifications
 * @summary SSE 알림 실시간 구독
 * @description 로그인한 사용자가 서버로부터 실시간 알림을 구독합니다. (Server-Sent Events)
 * @tags Notification
 * @security BearerAuth
 * @returns {string} 200 - SSE 연결 성공 (event-stream)
 * @example response - 200 - SSE 연결 예시
 * event: notification\ndata: {"notification":{...},"unreadCount":3,"hasUnread":true}\n\n
 */
sseRouter.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  registerSSE(userId, res);
});

export default sseRouter;

import { Request, Response, Router } from "express";
import { registerSSE } from "../utils/emitNotificationSSE";
import { verifyAccessToken } from "../middlewares/verifyToken";

const sseRouter = Router();

/**
 * @swagger
 * /sse/notifications:
 *   get:
 *     summary: SSE 알림 실시간 구독
 *     description: 로그인한 사용자가 서버로부터 실시간 알림을 구독합니다. (Server-Sent Events)
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: SSE 연결 성공 (event-stream)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *             example: |
 *               event: notification
 *               data: {"notification":{"id":"clx123","type":"ESTIMATE_ARRIVED","title":"새 견적 요청","content":"새로운 견적 요청이 등록되었습니다."},"unreadCount":3,"hasUnread":true}
 *
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               message: "Unauthorized"
 */
sseRouter.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const userId = req.user?.userId;
  console.log('userId', userId);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log('=== SSE 요청 받음 ===');
  console.log('Headers:', req.headers);
  console.log('User-Agent:', req.get('User-Agent'));
  console.log('IP:', req.ip || req.connection.remoteAddress);

  registerSSE(userId, res);
});

export default sseRouter;

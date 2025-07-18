import { Notification } from "@prisma/client";
import { Response } from "express";

type NotificationEvent = {
  notification: Notification;
  unreadCount: number;
};

// 유저별 SSE 연결 저장소
const sseClients = new Map<number, Response>();

/**
 * SSE 연결을 등록합니다.
 * @param userId 사용자 ID
 * @param res SSE Response 객체
 */
export function registerSSE(userId: number, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write("\n"); // 연결 초기화

  sseClients.set(userId, res);

  // 연결 끊김 감지
  res.on("close", () => {
    sseClients.delete(userId);
  });
}

/**
 * 해당 사용자에게 알림 SSE를 전송합니다.
 * @param userId 사용자 ID
 * @param payload 전송할 알림 데이터
 */
export function emitNotificationSSE(
  userId: number,
  payload: NotificationEvent
) {
  const client = sseClients.get(userId);
  if (!client) return;

  client.write(`event: notification\n`);
  client.write(`data: ${JSON.stringify(payload)}\n\n`);
}

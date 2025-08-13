import { Notification } from "@prisma/client";
import { Response } from "express";
import prisma from "../db/prisma/prisma";
import { captureSSEError } from "./sentryUtils";

// NotificationEvent 타입에 hasUnread 추가
export type NotificationEvent = {
  notification: Notification;
  unreadCount: number;
  hasUnread: boolean;
};

// 유저별 SSE 연결 저장소
export const sseClients = new Map<string, Response>();

/**
 * SSE 연결을 등록합니다.
 * @param userId 사용자 ID
 * @param res SSE Response 객체
 */
export function registerSSE(userId: string, res: Response) {
  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    console.log('응답헤더 설정 완료');

    res.write("\n"); // 연결 초기화

    sseClients.set(userId, res);

    console.log(`✅ 클라이언트 저장 완료. 현재 총 클라이언트: ${sseClients.size}`);

    // 연결 끊김 감지
    res.on("close", () => {
      sseClients.delete(userId);
    });
  } catch (error) {
    captureSSEError(error as Error, {
      operation: "register_sse",
      userId,
    });
    throw error;
  }
}

/**
 * 해당 사용자에게 알림 SSE를 전송합니다.
 * @param userId 사용자 ID
 * @param notification 알림 데이터
 */
export async function emitNotificationSSE(
  userId: string,
  notification: Notification
) {
  try {
    const client = sseClients.get(userId);
    if (!client) {
      return;
    }

    // 안읽은 알림 개수와 hasUnread 동시 계산
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    const hasUnread = unreadCount > 0;

    const payload: NotificationEvent = {
      notification,
      unreadCount,
      hasUnread,
    };

    client.write(`event: notification\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch (error) {
    captureSSEError(error as Error, {
      operation: "emit_notification_sse",
      userId,
      notificationId: notification.id,
    });
    throw error;
  }
}

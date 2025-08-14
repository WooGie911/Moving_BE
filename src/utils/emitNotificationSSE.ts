import { Notification } from "@prisma/client";
import { Response } from "express";
import prisma from "../db/prisma/prisma";
import { captureSSEError } from "./sentryUtils";
import { parseDateToDateTime } from "./dateUtils";

// NotificationEvent 타입 수정 - 일반 알림 API와 동일한 구조
export type NotificationEvent = {
  notification: {
    id: string;
    actionId: string;
    userId: string;
    userType: string;
    type: string;
    message: string; // 선택된 언어의 메시지만
    path: string | null;
    isRead: boolean;
    createdAt: Date | null; // parseDateToDateTime으로 변환된 Date 객체
    updatedAt: Date | null; // parseDateToDateTime으로 변환된 Date 객체
    deletedAt: Date | null;
  };
  unreadCount: number;
  hasUnread: boolean;
};

// 유저별 SSE 연결 저장소 (언어 정보 포함)
export const sseClients = new Map<string, { res: Response; lang: string }>();

/**
 * SSE 연결을 등록합니다.
 * @param userId 사용자 ID
 * @param res SSE Response 객체
 * @param lang 언어 코드 (기본값: 'ko')
 */
export function registerSSE(userId: string, res: Response, lang: string = 'ko') {
  try {
    // 헤더는 이미 sse.route.ts에서 설정됨
    res.write("data: connected\n\n");

    sseClients.set(userId, { res, lang });

    const heartbeat = setInterval(() => {
      if (!res.destroyed) {
        res.write("data: heartbeat\n\n");
      } else {
        clearInterval(heartbeat);
      }
    }, 25000);

    // 연결 종료 감지
    res.on("close", () => {
      clearInterval(heartbeat);
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
    const clientInfo = sseClients.get(userId);
    if (!clientInfo) {
      return;
    }

    const { res: client, lang } = clientInfo;

    // 안읽은 알림 개수와 hasUnread 동시 계산
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    const hasUnread = unreadCount > 0;

    // 언어별 메시지 선택 (일반 알림 API와 동일한 로직)
    let message;
    switch (lang) {
      case 'en':
        message = notification.messageEn;
        break;
      case 'zh':
        message = notification.messageZh;
        break;
      default:
        message = notification.messageKo;
        break;
    }

    // 일반 알림 API와 동일한 구조로 포맷팅
    const formattedNotification = {
      id: notification.id,
      actionId: notification.actionId,
      userId: notification.userId,
      userType: notification.userType,
      type: notification.type,
      message, // 선택된 언어의 메시지만
      path: notification.path,
      isRead: notification.isRead,
      createdAt: parseDateToDateTime(notification.createdAt.toISOString()),
      updatedAt: parseDateToDateTime(notification.updatedAt.toISOString()),
      deletedAt: notification.deletedAt ? parseDateToDateTime(notification.deletedAt.toISOString()) : null,
    };

    const payload: NotificationEvent = {
      notification: formattedNotification,
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

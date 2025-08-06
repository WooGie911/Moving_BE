import { Prisma } from "@prisma/client";
import prisma from "../db/prisma/prisma";
import { actionNotificationMap } from "../utils/actionNotificationMap";
import { emitNotificationSSE } from "../utils/emitNotificationSSE";
import { Action } from "@prisma/client";

// Prisma 미들웨어: actionCreate 함수에서 새로운 액션이 생성될 때 notification 자동 생성.
export const notificationMiddleware: Prisma.Middleware = async (
  params,
  next
) => {
  const result = await next(params);

  // 액션 생성 감지
  if (params.model === "Action" && params.action === "create") {
    const action = result as Action;

    const mapping = actionNotificationMap[action.type];
    if (!mapping) {
      return result;
    }

    try {
      const receivers = await mapping.getReceivers(action);

      if (receivers.length === 0) {
        return result;
      }

      const notifications = await Promise.all(
        receivers.map(async (receiver) => {
          const message = mapping.buildMessage(action, receiver.userType);
          
          return prisma.notification.create({
            data: {
              userId: receiver.id,
              userType: receiver.userType,
              actionId: action.id,
              type: mapping.type,
              title: message.title,
              content: message.content,
              path: message.path,
            },
          });
        })
      );

      // 실시간 알림 SSE 전송
      for (const notification of notifications) {
        try {
          emitNotificationSSE(notification.userId, notification);
        } catch (error) {
          console.error("SSE 이벤트 발송 실패:", error);
        }
      }
    } catch (error) {
      console.error("알림 생성 실패:", error);
      // 알림 생성 실패해도 Action 생성은 계속 진행
    }
  }

  return result;
};

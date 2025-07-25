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
    if (!mapping) return result;

    const receivers = await mapping.getReceivers(action);

    const notifications = await Promise.all(
      receivers.map(async (receiver) => {
        const message = mapping.buildMessage(action, receiver.userType);
        return prisma.notification.create({
          data: {
            userId: receiver.id,
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
      emitNotificationSSE(notification.userId, notification);
    }
  }

  return result;
};

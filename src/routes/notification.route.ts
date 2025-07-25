import { Router } from "express";
import notificationController from "../controllers/notification.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const notificationRouter = Router();

/**
 * GET /notifications
 * @summary 알림 목록 조회
 * @description 로그인한 사용자의 알림 목록을 조회합니다.
 * @tags Notification
 * @security BearerAuth
 * @param {number} limit.query - 한 번에 가져올 알림 개수 (기본값: 5)
 * @param {number} offset.query - 페이지네이션 오프셋 (기본값: 0)
 * @returns {object} 200 - 알림 목록 조회 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "알림 목록입니다.",
 *   "data": {
 *     "items": [
 *       {
 *         "id": "clx...",
 *         "actionId": "clx...",
 *         "userId": "clx...",
 *         "type": "ESTIMATE_ARRIVED",
 *         "title": "새 견적 요청이 등록되었습니다.",
 *         "content": "새로운 견적 요청이 등록되었습니다.",
 *         "path": "/estimateRequests/clx...",
 *         "isRead": false,
 *         "createdAt": "2025-07-10T00:33:16.456Z",
 *         "updatedAt": "2025-07-10T00:33:16.456Z"
 *       }
 *     ],
 *     "total": 10,
 *     "limit": 5,
 *     "offset": 0,
 *     "hasUnread": true
 *   }
 * }
 */
notificationRouter.get(
  "/",
  verifyAccessToken,
  notificationController.getNotifications
);

/**
 * PATCH /notifications/:notificationId/read
 * @summary 알림 읽음 처리
 * @description 특정 알림을 읽음 처리합니다.
 * @tags Notification
 * @security BearerAuth
 * @param {string} notificationId.path.required - 알림 ID (cuid)
 * @returns {object} 200 - 알림 읽음 처리 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "알림이 읽음 처리되었습니다.",
 *   "data": {
 *     "id": "clx...",
 *     "isRead": true
 *   }
 * }
 */
notificationRouter.patch(
  "/:notificationId/read",
  verifyAccessToken,
  notificationController.readNotification
);

/**
 * PATCH /notifications/read-all
 * @summary 전체 알림 읽음 처리
 * @description 로그인한 사용자의 모든 알림을 읽음 처리합니다.
 * @tags Notification
 * @security BearerAuth
 * @returns {object} 200 - 전체 알림 읽음 처리 성공
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "message": "모든 알림이 읽음 처리되었습니다.",
 *   "data": {
 *     "count": 7
 *   }
 * }
 */
notificationRouter.patch(
  "/read-all",
  verifyAccessToken,
  notificationController.readAllNotifications
);

export default notificationRouter;

import { Router } from "express";
import notificationController from "../controllers/notification.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const notificationRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 알림 ID
 *         actionId:
 *           type: string
 *           description: 액션 ID
 *         userId:
 *           type: string
 *           description: 사용자 ID
 *         type:
 *           type: string
 *           description: 알림 타입
 *           enum: [ESTIMATE_ARRIVED, ESTIMATE_ACCEPTED, ESTIMATE_REJECTED, MOVE_COMPLETED]
 *         title:
 *           type: string
 *           description: 알림 제목
 *         content:
 *           type: string
 *           description: 알림 내용
 *         path:
 *           type: string
 *           description: 관련 페이지 경로
 *         isRead:
 *           type: boolean
 *           description: 읽음 여부
 *         createdAt:
 *           type: string
 *           description: 생성일시
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           description: 수정일시
 *           format: date-time
 *
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationItem'
 *               description: 알림 목록
 *             total:
 *               type: integer
 *               description: 전체 알림 개수
 *             limit:
 *               type: integer
 *               description: 한 번에 가져온 알림 개수
 *             offset:
 *               type: integer
 *               description: 페이지네이션 오프셋
 *             hasUnread:
 *               type: boolean
 *               description: 읽지 않은 알림 존재 여부
 *
 *     NotificationReadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: 알림 ID
 *             isRead:
 *               type: boolean
 *               description: 읽음 여부
 *
 *     NotificationReadAllResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: 읽음 처리된 알림 개수
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     description: 로그인한 사용자의 알림 목록을 조회합니다.
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 한 번에 가져올 알림 개수, 기본값 5
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: 페이지네이션 오프셋, 기본값 0
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *             example:
 *               success: true
 *               message: "알림 목록입니다."
 *               data:
 *                 items:
 *                   - id: "clx..."
 *                     actionId: "clx..."
 *                     userId: "clx..."
 *                     type: "ESTIMATE_ARRIVED"
 *                     title: "새 견적 요청이 등록되었습니다."
 *                     content: "새로운 견적 요청이 등록되었습니다."
 *                     path: "/estimateRequests/clx..."
 *                     isRead: false
 *                     createdAt: "2025-07-10T00:33:16.456Z"
 *                     updatedAt: "2025-07-10T00:33:16.456Z"
 *                 total: 10
 *                 limit: 5
 *                 offset: 0
 *                 hasUnread: true
 */
notificationRouter.get("/", verifyAccessToken, notificationController.getNotifications);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: 알림 읽음 처리
 *     description: 특정 알림을 읽음 처리합니다.
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: 알림 ID (cuid)
 *     responses:
 *       200:
 *         description: 알림 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationReadResponse'
 *             example:
 *               success: true
 *               message: "알림이 읽음 처리되었습니다."
 *               data:
 *                 id: "clx..."
 *                 isRead: true
 */
notificationRouter.patch("/:notificationId/read", verifyAccessToken, notificationController.readNotification);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: 전체 알림 읽음 처리
 *     description: 로그인한 사용자의 모든 알림을 읽음 처리합니다.
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 전체 알림 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationReadAllResponse'
 *             example:
 *               success: true
 *               message: "모든 알림이 읽음 처리되었습니다."
 *               data:
 *                 count: 7
 */
notificationRouter.patch("/read-all", verifyAccessToken, notificationController.readAllNotifications);

export default notificationRouter;

import { Request, Response } from "express";
import { NotificationType } from "@prisma/client";
import NotificationController from "./notification.controller";

// 테스트용 Request 타입 정의
interface TestRequest extends Omit<Request, 'user'> {
  user?: {
    userId: string;
    name: string;
    userType: "CUSTOMER" | "MOVER";
    hasProfile: boolean;
  };
}

// 서비스 모듈 전체를 모킹
jest.mock("../services/notification.service", () => ({
  getNotifications: jest.fn(),
  readNotification: jest.fn(),
  readAllNotifications: jest.fn(),
}));

import NotificationService from "../services/notification.service";
const mockService = NotificationService as jest.Mocked<
  typeof NotificationService
>;

describe("NotificationController", () => {
  let req: Partial<TestRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      user: {
        userId: "user-1",
        name: "test",
        userType: "CUSTOMER",
        hasProfile: true,
      },
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("성공적으로 알림 목록을 조회한다", async () => {
      // Setup
      const mockNotifications = {
        hasUnread: true,
        items: [
          {
            id: "notification-1",
            actionId: "action-1",
            userId: "user-1",
            type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
            title: "새로운 견적 요청",
            content: "테스트 알림 1",
            path: null,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          {
            id: "notification-2",
            actionId: "action-2",
            userId: "user-1",
            type: "ESTIMATE_ARRIVED" as NotificationType,
            title: "견적이 도착했습니다",
            content: "테스트 알림 2",
            path: null,
            isRead: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };

      mockService.getNotifications.mockResolvedValue(mockNotifications);

      // Exercise
      await NotificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getNotifications).toHaveBeenCalledWith("user-1", 5, 0);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "알림 목록입니다.",
        data: mockNotifications,
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      const error = new Error("서비스 에러");
      mockService.getNotifications.mockRejectedValue(error);

      // Exercise
      await NotificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("readNotification", () => {
    it("성공적으로 알림을 읽음 처리한다", async () => {
      // Setup
      req.params = { notificationId: "notification-1" };

      const mockNotification = {
        id: "notification-1",
        actionId: "action-1",
        userId: "user-1",
        type: "ESTIMATE_REQUEST_ARRIVED" as NotificationType,
        title: "새로운 견적 요청",
        content: "테스트 알림 1",
        path: null,
        isRead: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockService.readNotification.mockResolvedValue(mockNotification);

      // Exercise
      await NotificationController.readNotification(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.readNotification).toHaveBeenCalledWith(
        "notification-1"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "알림이 읽음 처리되었습니다.",
        data: mockNotification,
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      req.params = { notificationId: "notification-1" };
      const error = new Error("서비스 에러");
      mockService.readNotification.mockRejectedValue(error);

      // Exercise
      await NotificationController.readNotification(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("readAllNotifications", () => {
    it("성공적으로 모든 알림을 읽음 처리한다", async () => {
      // Setup
      mockService.readAllNotifications.mockResolvedValue(5);

      // Exercise
      await NotificationController.readAllNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.readAllNotifications).toHaveBeenCalledWith("user-1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "모든 알림이 읽음 처리되었습니다.",
        data: { count: 5 },
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      const error = new Error("서비스 에러");
      mockService.readAllNotifications.mockRejectedValue(error);

      // Exercise
      await NotificationController.readAllNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

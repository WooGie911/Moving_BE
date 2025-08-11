import { Request, Response } from "express";
import { NotificationType, UserType } from "@prisma/client";
import notificationController from "./notification.controller";

// 테스트용 Request 타입 정의
interface TestRequest extends Omit<Request, "user"> {
  user?: {
    userId: string;
    name: string | null;
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

import notificationService from "../services/notification.service";
const mockService = notificationService as jest.Mocked<
  typeof notificationService
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
      req.query = { userType: "CUSTOMER", limit: "10", offset: "0" };
      
      const mockNotifications = {
        hasUnread: true,
        items: [
          {
            id: "notification-1",
            actionId: "action-1",
            userId: "user-1",
            userType: "CUSTOMER" as UserType,
            type: "ESTIMATE_STATUS_UPDATED" as NotificationType,
            message: "<span class=\"font-bold\">성민기사</span> 기사님의 견적이 <span class=\"text-primary-400 font-bold\">확정</span>되었어요.",
            path: "/estimateRequest/pending/test-id",
            isRead: false,
            createdAt: "2025-08-09",
            updatedAt: "2025-08-09",
            deletedAt: null,
          },
          {
            id: "notification-2",
            actionId: "action-2",
            userId: "user-1",
            userType: "CUSTOMER" as UserType,
            type: "WELCOME" as NotificationType,
            message: "<span class=\"font-bold\">회원가입</span>을 환영합니다!",
            path: "/",
            isRead: true,
            createdAt: "2025-08-09",
            updatedAt: "2025-08-09",
            deletedAt: null,
          },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };

      mockService.getNotifications.mockResolvedValue(mockNotifications);

      // Exercise
      await notificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getNotifications).toHaveBeenCalledWith(
        "CUSTOMER",
        "user-1",
        10,
        0,
        "ko" // 기본 언어
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "알림 목록입니다.",
        data: mockNotifications,
      });
    });

    it("userId가 없으면 에러를 반환한다", async () => {
      // Setup
      req.user = undefined;

      // Exercise
      await notificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "해당 유저를 찾을수 없습니다.",
      });
    });

    it("기본값으로 limit과 offset을 사용한다", async () => {
      // Setup
      req.query = { userType: "CUSTOMER" };
      
      const mockNotifications = {
        hasUnread: false,
        items: [],
        total: 0,
        limit: 5,
        offset: 0,
      };

      mockService.getNotifications.mockResolvedValue(mockNotifications);

      // Exercise
      await notificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getNotifications).toHaveBeenCalledWith(
        "CUSTOMER",
        "user-1",
        5,
        0,
        "ko" // 기본 언어
      );
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      req.query = { userType: "CUSTOMER" };
      const error = new Error("서비스 에러");
      mockService.getNotifications.mockRejectedValue(error);

      // Exercise
      await notificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });

    it("언어 파라미터를 올바르게 전달한다", async () => {
      // Setup
      req.query = { userType: "CUSTOMER", lang: "en" };
      
      const mockNotifications = {
        hasUnread: false,
        items: [],
        total: 0,
        limit: 5,
        offset: 0,
      };

      mockService.getNotifications.mockResolvedValue(mockNotifications);

      // Exercise
      await notificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getNotifications).toHaveBeenCalledWith(
        "CUSTOMER",
        "user-1",
        5,
        0,
        "en" // 영어 언어
      );
    });

    it("중국어 언어 파라미터를 올바르게 전달한다", async () => {
      // Setup
      req.query = { userType: "CUSTOMER", lang: "zh" };
      
      const mockNotifications = {
        hasUnread: false,
        items: [],
        total: 0,
        limit: 5,
        offset: 0,
      };

      mockService.getNotifications.mockResolvedValue(mockNotifications);

      // Exercise
      await notificationController.getNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(mockService.getNotifications).toHaveBeenCalledWith(
        "CUSTOMER",
        "user-1",
        5,
        0,
        "zh" // 중국어 언어
      );
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
        userType: "CUSTOMER" as UserType,
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
      await notificationController.readNotification(
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

    it("notificationId가 없으면 에러를 반환한다", async () => {
      // Setup
      req.params = {};

      // Exercise
      await notificationController.readNotification(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "해당 알림을 찾을수 없습니다.",
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      req.params = { notificationId: "notification-1" };
      const error = new Error("서비스 에러");
      mockService.readNotification.mockRejectedValue(error);

      // Exercise
      await notificationController.readNotification(
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
      await notificationController.readAllNotifications(
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

    it("userId가 없으면 에러를 반환한다", async () => {
      // Setup
      req.user = undefined;

      // Exercise
      await notificationController.readAllNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "해당 유저를 찾을수 없습니다.",
      });
    });

    it("서비스 에러 시 에러를 반환한다", async () => {
      // Setup
      const error = new Error("서비스 에러");
      mockService.readAllNotifications.mockRejectedValue(error);

      // Exercise
      await notificationController.readAllNotifications(
        req as Request,
        res as Response,
        next
      );

      // Assertion
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

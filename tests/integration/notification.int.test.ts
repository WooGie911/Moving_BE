import request from "supertest";
import app from "../../src/app";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({ notificationMiddleware: jest.fn() }));
import { getCustomerToken } from "../helpers/auth";
import prisma from "../../src/db/prisma/prisma";

describe("알림 통합 테스트", () => {
  let token: string;

  // 테스트 전후로 데이터베이스 정리
  beforeAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.action.deleteMany();
    token = await getCustomerToken();
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.action.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 알림 데이터 정리 (테스트 격리)
    await prisma.notification.deleteMany();
    await prisma.action.deleteMany();
  });

  describe("GET /notifications - 알림 목록 조회", () => {
    test("고객 사용자로 알림 목록을 조회할 수 있어야 한다", async () => {
      // Setup: 테스트용 알림 데이터 생성
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      const action = await prisma.action.create({
        data: {
          type: "WELCOME",
          userId: customer!.id,
          entityId: "123",
          entityType: "USER",
          metadata: { message: "테스트 알림" }
        }
      });

      await prisma.notification.create({
        data: {
          actionId: action.id,
          userId: customer!.id,
          userType: "CUSTOMER",
          type: "WELCOME",
          messageKo: "테스트 알림 메시지",
          messageEn: "Test notification message",
          messageZh: "测试通知消息",
          path: "/test",
          isRead: false
        }
      });

      // Exercise: API 요청 실행
      const response = await request(app)
        .get("/notifications?userType=CUSTOMER&limit=5&offset=0&lang=ko")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("알림 목록입니다.");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);

      // DB에 실제로 저장되었는지 확인
      const dbNotification = await prisma.notification.findFirst({
        where: { userId: customer!.id }
      });
      expect(dbNotification).toBeTruthy();
    });

    test("인증 토큰 없이 알림 목록 조회 시 401 에러를 반환해야 한다", async () => {
      // Exercise: 토큰 없이 API 요청
      const response = await request(app)
        .get("/notifications?userType=CUSTOMER")
        .expect(401);

      // Assertion: 에러 응답 검증
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("로그인이 필요합니다. 다시 로그인해 주세요.");
    });
  });

  describe("PATCH /notifications/:notificationId/read - 개별 알림 읽음 처리", () => {
    test("존재하는 알림을 읽음 처리할 수 있어야 한다", async () => {
      // Setup: 테스트용 알림 데이터 생성
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      const action = await prisma.action.create({
        data: {
          type: "WELCOME",
          userId: customer!.id,
          entityId: "123",
          entityType: "USER",
          metadata: { message: "테스트 알림" }
        }
      });

      const notification = await prisma.notification.create({
        data: {
          actionId: action.id,
          userId: customer!.id,
          userType: "CUSTOMER",
          type: "WELCOME",
          messageKo: "테스트 알림",
          messageEn: "Test notification",
          messageZh: "测试通知",
          path: "/",
          isRead: false
        }
      });

      // Exercise: API 요청 실행
      const response = await request(app)
        .patch(`/notifications/${notification.id}/read`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("알림이 읽음 처리되었습니다.");
      expect(response.body.data.id).toBe(notification.id);
      expect(response.body.data.isRead).toBe(true);

      // DB에 실제로 읽음 처리되었는지 확인
      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification.id }
      });
      expect(updatedNotification?.isRead).toBe(true);
    });

    test("존재하지 않는 알림 ID로 읽음 처리 시 400 에러를 반환해야 한다", async () => {
      // Exercise: 존재하지 않는 ID로 API 요청
      const response = await request(app)
        .patch("/notifications/non-existent-id/read")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      // Assertion: 에러 응답 검증
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("해당 알림을 찾을수 없습니다.");
    });
  });

  describe("PATCH /notifications/read-all - 전체 알림 읽음 처리", () => {
    test("모든 읽지 않은 알림을 읽음 처리할 수 있어야 한다", async () => {
      // Setup: 테스트용 알림 데이터 생성 (읽지 않은 알림 3개)
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      
      const action1 = await prisma.action.create({
        data: {
          type: "WELCOME",
          userId: customer!.id,
          entityId: "123",
          entityType: "USER",
          metadata: { message: "테스트 알림 1" }
        }
      });

      const action2 = await prisma.action.create({
        data: {
          type: "ESTIMATE_SUBMITTED",
          userId: customer!.id,
          entityId: "456",
          entityType: "ESTIMATE",
          metadata: { message: "테스트 알림 2" }
        }
      });

      const action3 = await prisma.action.create({
        data: {
          type: "ESTIMATE_REQUEST_CREATE",
          userId: customer!.id,
          entityId: "789",
          entityType: "ESTIMATE_REQUEST",
          metadata: { message: "테스트 알림 3" }
        }
      });

      // 읽지 않은 알림 3개 생성
      await prisma.notification.createMany({
        data: [
          {
            actionId: action1.id,
            userId: customer!.id,
            userType: "CUSTOMER",
            type: "WELCOME",
            messageKo: "테스트 알림 1",
            messageEn: "Test notification 1",
            messageZh: "测试通知1",
            path: "/",
            isRead: false
          },
          {
            actionId: action2.id,
            userId: customer!.id,
            userType: "CUSTOMER",
            type: "ESTIMATE_ARRIVED",
            messageKo: "테스트 알림 2",
            messageEn: "Test notification 2",
            messageZh: "测试通知2",
            path: "/estimates",
            isRead: false
          },
          {
            actionId: action3.id,
            userId: customer!.id,
            userType: "CUSTOMER",
            type: "ESTIMATE_REQUEST_ARRIVED",
            messageKo: "테스트 알림 3",
            messageEn: "Test notification 3",
            messageZh: "测试通知3",
            path: "/requests",
            isRead: false
          }
        ]
      });

      // Exercise: API 요청 실행
      const response = await request(app)
        .patch("/notifications/read-all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("모든 알림이 읽음 처리되었습니다.");
      expect(response.body.data).toBeDefined();

      // DB에 실제로 모든 알림이 읽음 처리되었는지 확인
      const updatedNotifications = await prisma.notification.findMany({
        where: { userId: customer!.id }
      });
      expect(updatedNotifications.length).toBe(3);
      updatedNotifications.forEach(notification => {
        expect(notification.isRead).toBe(true);
      });
    });

    test("읽지 않은 알림이 없을 때도 성공을 반환해야 한다", async () => {
      // Setup: 이미 읽은 알림 1개 생성
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      const action = await prisma.action.create({
        data: {
          type: "WELCOME",
          userId: customer!.id,
          entityId: "123",
          entityType: "USER",
          metadata: { message: "이미 읽은 알림" }
        }
      });

      await prisma.notification.create({
        data: {
          actionId: action.id,
          userId: customer!.id,
          userType: "CUSTOMER",
          type: "WELCOME",
          messageKo: "이미 읽은 알림",
          messageEn: "Already read notification",
          messageZh: "已读通知",
          path: "/",
          isRead: true
        }
      });

      // Exercise: API 요청 실행
      const response = await request(app)
        .patch("/notifications/read-all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("모든 알림이 읽음 처리되었습니다.");
    });

    test("알림이 없을 때도 성공을 반환해야 한다", async () => {
      // Exercise: 알림이 없는 상태에서 API 요청
      const response = await request(app)
        .patch("/notifications/read-all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("모든 알림이 읽음 처리되었습니다.");
    });
  });
});

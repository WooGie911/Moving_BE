import moverScheduleController from "./moverSchedule.controller";
import {
  ServiceError,
  ServiceValidationError,
  ControllerAuthError,
  ControllerValidationError,
} from "../types/errors.types";

// 서비스 모킹
jest.mock("../services/moverSchedule.service", () => ({
  __esModule: true,
  default: {
    getMonthlySchedules: jest.fn(),
  },
}));

// Sentry 모킹
jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
}));

import moverScheduleService from "../services/moverSchedule.service";
import * as Sentry from "@sentry/node";

const mockedService = moverScheduleService as jest.Mocked<typeof moverScheduleService>;

const createMockRequest = (overrides: any = {}) => ({
  user: { userId: "mover-1", userType: "MOVER" },
  params: { year: "2025", month: "7" },
  body: {},
  query: {},
  method: "GET",
  url: "/api/mover-schedules/monthly/2025/7",
  ...overrides,
});

const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("moverScheduleController.getMonthlySchedules", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
  });

  it("성공적으로 월별 스케줄을 반환한다 (200)", async () => {
    const mockData = [
      {
        id: "request-1",
        customerName: "고객A",
        movingType: "home" as const,
        status: "confirmed" as const,
        fromAddress: "서울 강남구 역삼동 123",
        toAddress: "경기 성남시 분당구 456",
        moveDate: "2025-07-15",
      },
    ];

    mockedService.getMonthlySchedules.mockResolvedValue(mockData);

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(mockedService.getMonthlySchedules).toHaveBeenCalledWith("mover-1", 2025, 7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "월별 스케줄 조회 성공",
      data: mockData,
    });
  });

  it("유저 타입이 MOVER가 아니면 401을 반환한다", async () => {
    req = createMockRequest({ user: { userId: "customer-1", userType: "CUSTOMER" } });

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.any(String), code: expect.any(String) }),
    );
  });

  it("사용자 정보가 없으면 401을 반환한다", async () => {
    req = createMockRequest({ user: undefined });

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.any(String), code: expect.any(String) }),
    );
  });

  it("year/month 파라미터가 없으면 400을 반환한다", async () => {
    req = createMockRequest({ params: {} });

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.any(String), code: expect.any(String) }),
    );
  });

  it("유효하지 않은 year/month 형식이면 400을 반환한다", async () => {
    req = createMockRequest({ params: { year: "abcd", month: "13" } });

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("서비스 유효성 에러를 400으로 반환한다", async () => {
    mockedService.getMonthlySchedules.mockRejectedValue(new ServiceValidationError("유효성 실패"));

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("유효성 실패") }),
    );
  });

  it("서비스/레포지토리 에러는 500으로 반환한다", async () => {
    mockedService.getMonthlySchedules.mockRejectedValue(new ServiceError("서비스 오류"));

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("서비스 오류") }),
    );
  });

  it("알 수 없는 에러는 500과 기본 메시지로 반환하며 Sentry에 전송한다", async () => {
    mockedService.getMonthlySchedules.mockRejectedValue(new Error("Unknown"));

    await moverScheduleController.getMonthlySchedules(req as any, res as any, jest.fn());

    expect(Sentry.captureException).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "월별 스케줄 조회 중 예상치 못한 오류가 발생했습니다",
    });
  });
});

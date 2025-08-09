import moverScheduleRepository from "./moverSchedule.repository";
import { RepositoryQueryError } from "../types/errors.types";

// prisma 인스턴스 모킹 (src/db/prisma/prisma.ts를 통해 사용됨)
jest.mock("../db/prisma/prisma", () => {
  return {
    __esModule: true,
    default: {
      estimate: {
        findMany: jest.fn(),
      },
    },
  };
});

import prisma from "../db/prisma/prisma";

describe("moverScheduleRepository.getMonthlySchedules", () => {
  const mockedPrisma = prisma as unknown as { estimate: { findMany: jest.Mock } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("해당 월의 ACCEPTED 견적/APPROVED 요청만 날짜순으로 조회하고 매핑한다", async () => {
    const moverId = "mover-1";
    const year = 2025;
    const month = 7;

    const mockEstimates = [
      {
        id: "estimate-1",
        moverId,
        estimateRequestId: "req-1",
        createdAt: new Date("2025-07-01T00:00:00Z"),
        updatedAt: new Date("2025-07-02T00:00:00Z"),
        estimateRequest: {
          id: "req-1",
          moveDate: new Date("2025-07-15"),
          moveType: "HOME",
          status: "APPROVED",
          customer: { id: "c1", name: "고객A", customerImage: null, nickname: null },
          fromAddress: {
            id: "a1",
            zoneCode: "",
            city: "서울",
            district: "강남구",
            detail: "역삼동 123",
            region: "SEOUL",
          },
          toAddress: {
            id: "a2",
            zoneCode: "",
            city: "경기",
            district: "성남시",
            detail: "분당구 456",
            region: "GYEONGGI",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    mockedPrisma.estimate.findMany.mockResolvedValue(mockEstimates);

    const result = await moverScheduleRepository.getMonthlySchedules(moverId, year, month);

    // 쿼리 조건 검증
    expect(mockedPrisma.estimate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          moverId,
          status: "ACCEPTED",
          deletedAt: null,
          estimateRequest: expect.objectContaining({
            deletedAt: null,
            status: { in: ["APPROVED"] },
            moveDate: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
          }),
        }),
        orderBy: { estimateRequest: { moveDate: "asc" } },
        select: expect.any(Object),
      }),
    );

    // 매핑 결과 검증
    expect(result).toEqual([
      expect.objectContaining({
        estimateId: "estimate-1",
        estimateRequestId: "req-1",
        moverId: "mover-1",
        moveDate: new Date("2025-07-15"),
        moveType: "HOME",
        requestStatus: "APPROVED",
        customer: expect.objectContaining({ name: "고객A" }),
        fromAddress: expect.objectContaining({ region: "SEOUL" }),
        toAddress: expect.objectContaining({ region: "GYEONGGI" }),
      }),
    ]);
  });

  it("DB 에러 시 RepositoryQueryError를 던진다", async () => {
    mockedPrisma.estimate.findMany.mockRejectedValue(new Error("db error"));

    await expect(moverScheduleRepository.getMonthlySchedules("mover-1", 2025, 7)).rejects.toThrow(RepositoryQueryError);
  });
});

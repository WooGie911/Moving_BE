import prisma from "../db/prisma/prisma";
import { TMoverScheduleWithDetails } from "../types/moverSchedule";
import { RepositoryQueryError } from "../types/errors.types";

const moverScheduleRepository = {
  // 월별 스케줄 조회 (캘린더용)
  getMonthlySchedules: async (moverId: string, year: number, month: number): Promise<TMoverScheduleWithDetails[]> => {
    try {
      // 해당 월의 시작일과 종료일 계산
      const startDate = new Date(year, month - 1, 1); // 월은 0부터 시작하므로 -1
      const endDate = new Date(year, month, 0); // 다음 달의 0일 = 이번 달의 마지막 날

      // Estimate 테이블에서 조회
      const estimates = await prisma.estimate.findMany({
        where: {
          moverId,
          status: "ACCEPTED", // EstimateStatus.ACCEPTED
          deletedAt: null,
          estimateRequest: {
            deletedAt: null,
            moveDate: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ["APPROVED"], // RequestStatus.APPROVED만 사용
            },
          },
        },
        orderBy: {
          estimateRequest: {
            moveDate: "asc",
          },
        },
        select: {
          id: true,
          moverId: true,
          estimateRequestId: true,
          createdAt: true,
          updatedAt: true,
          estimateRequest: {
            select: {
              id: true,
              moveDate: true,
              moveType: true,
              status: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  customerImage: true,
                  nickname: true,
                },
              },
              fromAddress: {
                select: {
                  id: true,
                  zoneCode: true,
                  city: true,
                  district: true,
                  detail: true,
                  region: true,
                },
              },
              toAddress: {
                select: {
                  id: true,
                  zoneCode: true,
                  city: true,
                  district: true,
                  detail: true,
                  region: true,
                },
              },
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      // 데이터 변환
      return estimates.map((estimate) => ({
        estimateId: estimate.id,
        estimateRequestId: estimate.estimateRequestId,
        moverId: estimate.moverId,
        moveDate: estimate.estimateRequest.moveDate,
        moveType: estimate.estimateRequest.moveType as "SMALL" | "HOME" | "OFFICE",
        requestStatus: estimate.estimateRequest.status,
        customer: estimate.estimateRequest.customer,
        fromAddress: {
          ...estimate.estimateRequest.fromAddress,
          detail: estimate.estimateRequest.fromAddress.detail || undefined,
        },
        toAddress: {
          ...estimate.estimateRequest.toAddress,
          detail: estimate.estimateRequest.toAddress.detail || undefined,
        },
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt,
      }));
    } catch (error) {
      throw new RepositoryQueryError("월별 스케줄 조회 중 데이터베이스 오류가 발생했습니다");
    }
  },
};

export default moverScheduleRepository;

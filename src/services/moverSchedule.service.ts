import moverScheduleRepository from "../repositories/moverSchedule.repository";
import {
  TMoverScheduleResponse,
  TMoverScheduleWithDetails,
  MoveTypeMapping,
  StatusMapping,
} from "../types/moverSchedule";
import { ServiceError, ServiceValidationError, RepositoryError } from "../types/errors.types";

const moverScheduleService = {
  // 월별 스케줄 조회 (캘린더용)
  getMonthlySchedules: async (moverId: string, year: number, month: number): Promise<TMoverScheduleResponse[]> => {
    try {
      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      if (!year || !month || year < 1900 || month < 1 || month > 12) {
        throw new ServiceValidationError("잘못된 년도 또는 월입니다");
      }

      // Repository에서 데이터 조회
      const scheduleDetails = await moverScheduleRepository.getMonthlySchedules(moverId, year, month);

      // 프론트엔드 형식으로 변환
      return scheduleDetails.map((detail) => moverScheduleService.transformToScheduleResponse(detail));
    } catch (error) {
      if (error instanceof ServiceValidationError) {
        throw error;
      }

      if (error instanceof RepositoryError) {
        throw new ServiceError("월별 스케줄 조회 중 오류가 발생했습니다");
      }

      console.error("moverScheduleService.getMonthlySchedules 에러:", error);
      throw new ServiceError("월별 스케줄 조회 중 예상치 못한 오류가 발생했습니다");
    }
  },

  // 프론트엔드 형식으로 변환하는 함수
  transformToScheduleResponse: (detail: TMoverScheduleWithDetails): TMoverScheduleResponse => {
    // 시간 포맷팅 함수
    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
    };

    // 주소 포맷팅 함수
    const formatAddress = (address: { city: string; district: string; detail: string | null }): string => {
      const parts = [address.city, address.district];
      if (address.detail) {
        parts.push(address.detail);
      }
      return parts.join(" ");
    };

    // 이사 유형 매핑
    const moveTypeMapping: MoveTypeMapping = {
      SMALL: "소형이사",
      HOME: "가정이사",
      OFFICE: "사무실이사",
    };

    // 상태 매핑
    const statusMapping: StatusMapping = {
      APPROVED: "confirmed",
      PENDING: "pending",
      COMPLETED: "completed",
    };

    return {
      id: detail.estimateRequestId,
      customerName: detail.customer.name,
      movingType: moveTypeMapping[detail.moveType] || "소형이사",
      time: formatTime(detail.moveDate),
      status: (statusMapping as any)[detail.requestStatus] || "pending",
      fromAddress: formatAddress(detail.fromAddress),
      toAddress: formatAddress(detail.toAddress),
      moveDate: detail.moveDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
    };
  },
};

export default moverScheduleService;

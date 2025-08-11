import moverScheduleRepository from "../repositories/moverSchedule.repository";
import * as Sentry from "@sentry/node";
import { TMoverScheduleResponse } from "../types/moverSchedule";
import { ServiceError, ServiceValidationError, RepositoryError } from "../types/errors.types";
import { validateScheduleInput, transformToScheduleResponse, handleScheduleError } from "../utils/scheduleUtils";

// 메인 서비스 객체
const moverScheduleService = {
  /**
   * 월별 스케줄 조회 (캘린더용)
   */
  getMonthlySchedules: async (moverId: string, year: number, month: number): Promise<TMoverScheduleResponse[]> => {
    try {
      validateScheduleInput(moverId, year, month);

      const scheduleDetails = await moverScheduleRepository.getMonthlySchedules(moverId, year, month);
      return scheduleDetails.map(transformToScheduleResponse);
    } catch (error) {
      if (error instanceof ServiceValidationError) {
        throw error;
      }

      if (error instanceof RepositoryError) {
        Sentry.captureException(error, {
          extra: { moverId, year, month },
          tags: { error_type: "schedule_error", operation: "get_monthly_schedules_repo_error" },
        });
        throw new ServiceError("월별 스케줄 조회 중 오류가 발생했습니다");
      }

      Sentry.captureException(error as Error, {
        extra: { moverId, year, month },
        tags: { error_type: "schedule_error", operation: "get_monthly_schedules_unknown_error" },
      });
      return handleScheduleError(error, "월별 스케줄 조회 중 예상치 못한 오류가 발생했습니다");
    }
  },
};

export default moverScheduleService;

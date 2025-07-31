import { NextFunction, Request, Response } from "express";
import moverScheduleService from "../services/moverSchedule.service";
import { NotFoundError } from "../types/commonError.types";
import {
  HTTP_STATUS,
  ServiceError,
  ServiceValidationError,
  ControllerAuthError,
  ControllerValidationError,
  RepositoryError,
} from "../types/errors.types";

const moverScheduleController = {
  // 월별 스케줄 조회 (캘린더용)
  getMonthlySchedules: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const { year, month } = req.params;

      // 기본 인증 확인
      if (!moverId || typeof moverId !== "string") {
        throw new ControllerAuthError("유효하지 않은 사용자 정보입니다");
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        throw new ControllerAuthError("기사님만 접근 가능합니다");
      }

      // 년도, 월 파라미터 검증
      if (!year || !month) {
        throw new ControllerValidationError("년도와 월 파라미터가 필요합니다");
      }

      const parsedYear = parseInt(year as string);
      const parsedMonth = parseInt(month as string);

      if (isNaN(parsedYear) || isNaN(parsedMonth)) {
        throw new ControllerValidationError("유효하지 않은 년도 또는 월입니다");
      }

      if (parsedYear < 1900 || parsedMonth < 1 || parsedMonth > 12) {
        throw new ControllerValidationError("년도는 1900년 이후, 월은 1-12 범위여야 합니다");
      }

      const result = await moverScheduleService.getMonthlySchedules(moverId, parsedYear, parsedMonth);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "월별 스케줄 조회 성공",
        data: result,
      });
    } catch (error) {
      // 구조화된 에러 처리
      if (error instanceof ControllerAuthError || error instanceof ControllerValidationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      if (error instanceof ServiceValidationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      if (error instanceof ServiceError || error instanceof RepositoryError) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error("moverScheduleController.getMonthlySchedules 에러:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "월별 스케줄 조회 중 예상치 못한 오류가 발생했습니다",
      });
    }
  },
};

export default moverScheduleController;

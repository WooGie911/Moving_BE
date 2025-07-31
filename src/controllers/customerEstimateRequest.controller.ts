import { NextFunction, Request, Response } from "express";
import customerEstimateRequestService from "../services/customerEstimateRequest.service";
import { NotFoundError } from "../types/commonError.types";
import { ControllerAuthError } from "../types/errors.types";

const customerEstimateRequestController = {
  // 1. 진행중인 견적요청 조회
  getPendingEstimateRequest: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId || typeof userId !== "string") {
        throw new ControllerAuthError("유효하지 않은 사용자 정보입니다.");
      }

      const result =
        await customerEstimateRequestService.getPendingEstimateRequest(userId);

      // 항상 200 OK로 내려주고, 빈 객체도 success: true로 반환
      res.status(200).json({
        success: true,
        message: "진행중인 견적요청 조회 성공",
        data: result,
      });
    } catch (error) {
      if (error instanceof ControllerAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
          layer: error.layer,
        });
        return;
      }
      next(error);
    }
  },

  // 2. 완료된 견적요청 목록 조회
  getReceivedEstimateRequests: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId || typeof userId !== "string") {
        throw new ControllerAuthError("유효하지 않은 사용자 정보입니다.");
      }

      const result =
        await customerEstimateRequestService.getReceivedEstimateRequests(
          userId
        );

      res.status(200).json({
        success: true,
        message: "완료된 견적요청 목록 조회 성공",
        data: result, // 서비스 리턴값 그대로 전달
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          code: (error as any).code || "NOT_FOUND",
          layer: (error as any).layer || "SERVICE",
        });
        return;
      }
      if (error instanceof ControllerAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
          layer: error.layer,
        });
        return;
      }
      next(error);
    }
  },

  // 3. 견적 확정
  confirmEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateId = req.query.estimateId;

      if (!userId || typeof userId !== "string") {
        throw new ControllerAuthError("유효하지 않은 사용자 정보입니다.");
      }

      if (!estimateId || typeof estimateId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }

      const result = await customerEstimateRequestService.confirmEstimate(
        userId,
        estimateId
      );

      res.status(200).json({
        success: true,
        message: "견적 확정 성공",
        data: result,
      });
    } catch (error) {
      if (error instanceof ControllerAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
          layer: error.layer,
        });
        return;
      }
      next(error);
    }
  },

  // 4. 견적 취소
  cancelEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateId = req.query.estimateId;

      if (!userId || typeof userId !== "string") {
        throw new ControllerAuthError("유효하지 않은 사용자 정보입니다.");
      }

      if (!estimateId || typeof estimateId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }

      const result = await customerEstimateRequestService.cancelEstimate(
        userId,
        estimateId
      );

      res.status(200).json({
        success: true,
        message: "견적 취소 성공",
        data: result,
      });
    } catch (error) {
      if (error instanceof ControllerAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
          layer: error.layer,
        });
        return;
      }
      next(error);
    }
  },

  // 5. 이사완료(구매확정)
  completeEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateId = req.query.estimateId;

      if (!userId || typeof userId !== "string") {
        throw new ControllerAuthError("유효하지 않은 사용자 정보입니다.");
      }

      if (!estimateId || typeof estimateId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }

      const result = await customerEstimateRequestService.completeEstimate(
        userId,
        estimateId
      );

      res.status(200).json({
        success: true,
        message: "이사완료 성공",
        data: result,
      });
    } catch (error) {
      if (error instanceof ControllerAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
          layer: error.layer,
        });
        return;
      }
      next(error);
    }
  },
};

export default customerEstimateRequestController;

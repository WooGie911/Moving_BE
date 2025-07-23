import { NextFunction, Request, Response } from "express";
import customerEstimateRequestService from "../services/customerEstimateRequest.service";
import { NotFoundError } from "../types/commonError.types";

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
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
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
      console.error("getPendingEstimateRequest error:", error);
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
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
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
      console.error("getReceivedEstimateRequests controller error:", error);
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  },

  // 3. 진행중인 견적요청의 특정 견적 상세 조회
  getPendingEstimateRequestDetail: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateId = req.params.estimateId;
      if (!userId || typeof userId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      if (!estimateId || typeof estimateId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }
      const result =
        await customerEstimateRequestService.getPendingEstimateRequestDetail(
          userId,
          estimateId
        );
      // 항상 200 OK로 내려주고, 빈 객체도 success: true로 반환
      res.status(200).json({
        success: true,
        message: "진행중인 견적 상세 조회 성공",
        data: result, // 빈 객체도 포함
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. 완료된 견적요청의 특정 견적 상세 조회
  getReceivedEstimateRequestDetail: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateRequestId = req.params.estimateRequestId;
      const estimateId = req.params.estimateId;
      if (!userId || typeof userId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적요청 ID입니다.",
        });
        return;
      }
      if (!estimateId || typeof estimateId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }
      const result =
        await customerEstimateRequestService.getReceivedEstimateRequestDetail(
          userId,
          estimateRequestId,
          estimateId
        );
      res.status(200).json({
        success: true,
        message: "완료된 견적 상세 조회 성공",
        data: result, // 서비스 리턴값 그대로 전달
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. 견적 확정
  confirmEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateId = req.query.estimateId;
      if (!userId || typeof userId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
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
      next(error);
    }
  },

  // 6. 지정 견적 요청
  designateEstimateRequest: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.userType;
      const estimateRequestId = req.query.estimateRequestId;
      const { message, moverId } = req.body;
      if (!userId || typeof userId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      if (userRole !== "CUSTOMER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 고객이 아닙니다.",
        });
        return;
      }
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적요청 ID입니다.",
        });
        return;
      }
      if (!moverId || typeof moverId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 기사님 ID입니다.",
        });
        return;
      }
      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "메시지를 입력해주세요.",
        });
        return;
      }
      if (message.length > 500) {
        res.status(400).json({
          success: false,
          message: "메시지는 500자 이내로 입력해주세요.",
        });
        return;
      }
      const result =
        await customerEstimateRequestService.designateEstimateRequest(
          estimateRequestId,
          userId,
          message.trim(),
          moverId
        );
      res.status(200).json({
        success: true,
        message: "지정 견적 요청 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default customerEstimateRequestController;

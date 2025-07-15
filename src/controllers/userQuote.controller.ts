import { NextFunction, Request, Response } from "express";
import userQuoteService from "../services/userQuote.service";

const userQuoteController = {
  // 1. 진행중인 견적 조회
  getPendingQuote: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      const result = await userQuoteService.getPendingQuote(userId);
      res.status(200).json({
        success: true,
        message: "진행중인 견적 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. 완료된 견적 목록 조회
  getReceivedQuotes: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      const result = await userQuoteService.getReceivedQuotes(userId);
      res.status(200).json({
        success: true,
        message: "완료된 견적 목록 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. 진행중인 견적 상세 조회
  getPendingQuoteDetail: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateId = Number(req.params.estimateId);

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      if (!estimateId || isNaN(estimateId) || estimateId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }

      const result = await userQuoteService.getPendingQuoteDetail(
        userId,
        estimateId
      );
      res.status(200).json({
        success: true,
        message: "진행중인 견적 상세 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. 완료된 견적 상세 조회
  getReceivedQuoteDetail: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const estimateId = Number(req.params.estimateId);
      const quoteId = Number(req.params.quoteId);

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      if (!estimateId || isNaN(estimateId) || estimateId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }

      if (!quoteId || isNaN(quoteId) || quoteId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 요청 ID입니다.",
        });
        return;
      }

      const result = await userQuoteService.getReceivedQuoteDetail(
        userId,
        estimateId,
        quoteId
      );
      res.status(200).json({
        success: true,
        message: "완료된 견적 상세 조회 성공",
        data: result,
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
      const estimateId = Number(req.query.estimateId);

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      if (!estimateId || isNaN(estimateId) || estimateId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }

      const result = await userQuoteService.confirmEstimate(userId, estimateId);
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
  designateQuote: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const quoteId = Number(req.query.quoteId); // URL 파라미터에서 쿼리 파라미터로 변경
      const { message, moverId } = req.body;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // CUSTOMER 권한 확인
      if (userRole !== "CUSTOMER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 고객이 아닙니다.",
        });
        return;
      }

      if (!quoteId || isNaN(quoteId) || quoteId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 ID입니다.",
        });
        return;
      }

      if (!moverId || typeof moverId !== "number" || moverId <= 0) {
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

      // 메시지 길이 제한 (예: 500자)
      if (message.length > 500) {
        res.status(400).json({
          success: false,
          message: "메시지는 500자 이내로 입력해주세요.",
        });
        return;
      }

      const result = await userQuoteService.designateQuote(
        quoteId,
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

export default userQuoteController;

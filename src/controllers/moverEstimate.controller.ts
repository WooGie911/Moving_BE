import { NextFunction, Request, Response } from "express";
import moverEstimateService from "../services/moverEstimate.service";

const moverEstimateController = {
  // 1. 견적 생성
  createEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { quoteId, price, description } = req.body;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!quoteId || typeof quoteId !== "number" || quoteId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 요청 ID입니다.",
        });
        return;
      }

      if (!price || typeof price !== "number" || price < 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 가격입니다.",
        });
        return;
      }

      if (
        !description ||
        typeof description !== "string" ||
        description.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "견적 설명을 입력해주세요.",
        });
        return;
      }

      // 설명 길이 제한 (예: 1000자)
      if (description.length > 1000) {
        res.status(400).json({
          success: false,
          message: "견적 설명은 1000자 이내로 입력해주세요.",
        });
        return;
      }

      const result = await moverEstimateService.createEstimate({
        quoteId,
        userId,
        price,
        description: description.trim(),
      });

      res.status(201).json({
        success: true,
        message: "견적 생성 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. 견적 반려
  rejectEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { quoteId, description } = req.body;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!quoteId || typeof quoteId !== "number" || quoteId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 요청 ID입니다.",
        });
        return;
      }

      if (
        !description ||
        typeof description !== "string" ||
        description.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "반려 사유를 입력해주세요.",
        });
        return;
      }

      // 설명 길이 제한 (예: 500자)
      if (description.length > 500) {
        res.status(400).json({
          success: false,
          message: "반려 사유는 500자 이내로 입력해주세요.",
        });
        return;
      }

      const result = await moverEstimateService.rejectEstimate({
        quoteId,
        userId,
        description: description.trim(),
      });

      res.status(201).json({
        success: true,
        message: "견적 반려 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. 서비스 가능 지역 견적 조회
  getRegionQuote: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { availableRegion, sortBy, customerName, movingType } = req.query;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (
        !availableRegion ||
        typeof availableRegion !== "string" ||
        availableRegion.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "서비스 가능 지역을 입력해주세요.",
        });
        return;
      }

      // 정렬 옵션 검증
      if (sortBy && !["movingDate", "createdAt"].includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 정렬 옵션입니다.",
        });
        return;
      }

      // 이사 타입 검증
      if (
        movingType &&
        !["SMALL", "HOME", "OFFICE"].includes(movingType as string)
      ) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 이사 타입입니다.",
        });
        return;
      }

      const result = await moverEstimateService.getRegionQuote(
        availableRegion.trim(),
        sortBy as "movingDate" | "createdAt" | undefined,
        customerName as string | undefined,
        movingType as "SMALL" | "HOME" | "OFFICE" | undefined
      );

      res.status(200).json({
        success: true,
        message: "서비스 가능 지역 견적 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. 지정 견적 조회
  getDesignatedQuote: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { sortBy, customerName, movingType } = req.query;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      // 정렬 옵션 검증
      if (sortBy && !["movingDate", "createdAt"].includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 정렬 옵션입니다.",
        });
        return;
      }

      // 이사 타입 검증
      if (
        movingType &&
        !["SMALL", "HOME", "OFFICE"].includes(movingType as string)
      ) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 이사 타입입니다.",
        });
        return;
      }

      const result = await moverEstimateService.getDesignatedQuote(
        userId,
        sortBy as "movingDate" | "createdAt" | undefined,
        customerName as string | undefined,
        movingType as "SMALL" | "HOME" | "OFFICE" | undefined
      );

      res.status(200).json({
        success: true,
        message: "지정 견적 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. 지역/지정 견적 통합 조회
  getAllQuotes: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const {
        region,
        designated,
        availableRegion,
        sortBy,
        customerName,
        movingType,
      } = req.query;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      // region/designated 쿼리 파싱 (문자열 true/false)
      const regionBool = region === "true";
      const designatedBool = designated === "true";

      if (!regionBool && !designatedBool) {
        res.status(200).json({
          success: true,
          message: "조회 결과 없음",
          data: { regionQuotes: [], designatedQuotes: [] },
        });
        return;
      }

      const result = await moverEstimateService.getAllQuotes(userId, {
        region: regionBool,
        designated: designatedBool,
        availableRegion: availableRegion as string | undefined,
        sortBy: sortBy as "movingDate" | "createdAt" | undefined,
        customerName: customerName as string | undefined,
        movingType: movingType as "SMALL" | "HOME" | "OFFICE" | undefined,
      });

      res.status(200).json({
        success: true,
        message: "견적 통합 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 6. 견적 상세 조회
  getQuoteById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const quoteId = Number(req.params.quoteId);

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
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

      const result = await moverEstimateService.getQuoteById(quoteId);
      res.status(200).json({
        success: true,
        message: "견적 상세 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 7. 내가 보낸 견적서 조회
  getMyEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      const result = await moverEstimateService.getMyEstimate(userId);
      res.status(200).json({
        success: true,
        message: "내가 보낸 견적서 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 8. 내가 반려한 견적 조회
  getMyRejectedQuotes: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      const result = await moverEstimateService.getMyRejectedQuotes(userId);
      res.status(200).json({
        success: true,
        message: "내가 반려한 견적 조회 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 9. 견적 상태 업데이트
  updateEstimateStatus: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const estimateId = Number(req.query.estimateId);
      const { status } = req.body;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateId || isNaN(estimateId) || estimateId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적서 ID입니다.",
        });
        return;
      }

      if (
        !status ||
        !["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"].includes(status)
      ) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 상태입니다.",
        });
        return;
      }

      const result = await moverEstimateService.updateEstimateStatus({
        estimateId,
        userId,
        status,
      });

      res.status(200).json({
        success: true,
        message: "견적 상태 업데이트 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 10. 견적서 업데이트
  updateEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const estimateId = Number(req.query.estimateId);
      const { price, description } = req.body;

      if (!userId || typeof userId !== "number" || userId <= 0) {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userRole !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateId || isNaN(estimateId) || estimateId <= 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적서 ID입니다.",
        });
        return;
      }

      if (!price || typeof price !== "number" || price < 0) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 가격입니다.",
        });
        return;
      }

      if (
        !description ||
        typeof description !== "string" ||
        description.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "견적 설명 10자 이상 입력해주세요.",
        });
        return;
      }

      // 설명 길이 제한 (예: 1000자)
      if (description.length > 1000) {
        res.status(400).json({
          success: false,
          message: "견적 설명은 1000자 이내로 입력해주세요.",
        });
        return;
      }

      const result = await moverEstimateService.updateEstimate({
        estimateId,
        userId,
        price,
        description: description.trim(),
      });

      res.status(200).json({
        success: true,
        message: "견적서 업데이트 성공",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default moverEstimateController;

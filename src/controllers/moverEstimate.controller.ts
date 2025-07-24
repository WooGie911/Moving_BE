import { NextFunction, Request, Response } from "express";
import moverEstimateService from "../services/moverEstimate.service";
import { NotFoundError } from "../types/commonError.types";

const moverEstimateController = {
  // 1. 견적 생성
  createEstimate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const { estimateRequestId, price, comment } = req.body;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateRequestId || typeof estimateRequestId !== "string") {
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
        !comment ||
        typeof comment !== "string" ||
        comment.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "견적 코멘트를 입력해주세요.",
        });
        return;
      }

      // 코멘트 길이 제한 (예: 1000자)
      if (comment.length > 1000) {
        res.status(400).json({
          success: false,
          message: "견적 코멘트는 1000자 이내로 입력해주세요.",
        });
        return;
      }

      const result = await moverEstimateService.createEstimate({
        estimateRequestId,
        moverId,
        price,
        comment: comment.trim(),
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
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const { estimateRequestId, comment } = req.body;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 요청 ID입니다.",
        });
        return;
      }

      if (
        !comment ||
        typeof comment !== "string" ||
        comment.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "반려 사유를 입력해주세요.",
        });
        return;
      }

      // 코멘트 길이 제한 (예: 500자)
      if (comment.length > 500) {
        res.status(400).json({
          success: false,
          message: "반려 사유는 500자 이내로 입력해주세요.",
        });
        return;
      }

      const result = await moverEstimateService.rejectEstimate({
        estimateRequestId,
        moverId,
        comment: comment.trim(),
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
  getRegionEstimateRequest: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const { sortBy, customerName, movingType } = req.query;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      // 정렬 옵션 검증
      if (sortBy && !["moveDate", "createdAt"].includes(sortBy as string)) {
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

      const result = await moverEstimateService.getRegionEstimateRequest(
        moverId,
        sortBy as "moveDate" | "createdAt" | undefined,
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
  getDesignatedEstimateRequest: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const { sortBy, customerName, movingType } = req.query;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      // 정렬 옵션 검증
      if (sortBy && !["moveDate", "createdAt"].includes(sortBy as string)) {
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

      const result = await moverEstimateService.getDesignatedEstimateRequest(
        moverId,
        sortBy as "moveDate" | "createdAt" | undefined,
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
  getAllEstimateRequests: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const { region, designated, sortBy, customerName, movingType } =
        req.query;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      if (userType !== "MOVER") {
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
          data: { regionEstimateRequests: [], designatedEstimateRequests: [] },
        });
        return;
      }

      const result = await moverEstimateService.getAllEstimateRequests(
        moverId,
        {
          region: regionBool,
          designated: designatedBool,
          sortBy: sortBy as "moveDate" | "createdAt" | undefined,
          customerName: customerName as string | undefined,
          movingType: movingType as "SMALL" | "HOME" | "OFFICE" | undefined,
        }
      );

      // 디버깅을 위한 로그 추가
      console.log("=== getAllEstimateRequests 디버깅 ===");
      console.log("region:", regionBool, "designated:", designatedBool);
      console.log(
        "regionEstimateRequests:",
        result.regionEstimateRequests?.length || 0
      );
      console.log(
        "designatedEstimateRequests:",
        result.designatedEstimateRequests?.length || 0
      );

      if (result.regionEstimateRequests) {
        console.log(
          "regionEstimateRequests status:",
          result.regionEstimateRequests.map((r) => ({
            id: r.id,
            status: r.status,
          }))
        );
      }
      if (result.designatedEstimateRequests) {
        console.log(
          "designatedEstimateRequests status:",
          result.designatedEstimateRequests.map((r) => ({
            id: r.id,
            status: r.status,
          }))
        );
      }

      res.status(200).json({
        success: true,
        message: "견적 통합 조회 성공",
        data: result,
      });
    } catch (error) {
      console.error("getAllEstimateRequests controller error:", error);
      console.error("에러 상세 정보:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : "Unknown",
      });
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: (error as Error).message,
        });
        return;
      }
      next(error);
    }
  },

  // 6. 견적 요청 상세 조회
  getEstimateRequestById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const estimateRequestId = req.params.estimateRequestId;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 요청 ID입니다.",
        });
        return;
      }

      const result =
        await moverEstimateService.getEstimateRequestById(estimateRequestId);
      res.status(200).json({
        success: true,
        message: "견적 요청 상세 조회 성공",
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
      const moverId = req.user?.userId;
      const userType = req.user?.userType;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      const result = await moverEstimateService.getMyEstimate(moverId);
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
  getMyRejectedEstimates: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moverId = req.user?.userId;
      const userType = req.user?.userType;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      const result = await moverEstimateService.getMyRejectedEstimates(moverId);

      res.status(200).json({
        success: true,
        message: "내가 반려한 견적 조회 성공",
        data: result,
      });
    } catch (error) {
      console.error("getMyRejectedEstimates controller error:", error);
      console.error("에러 상세 정보:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : "Unknown",
      });
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
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const estimateId = req.query.estimateId as string;
      const { status } = req.body;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateId || typeof estimateId !== "string") {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적서 ID입니다.",
        });
        return;
      }

      if (
        !status ||
        !["PROPOSED", "ACCEPTED", "REJECTED", "AUTO_REJECTED"].includes(status)
      ) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 상태입니다.",
        });
        return;
      }

      const result = await moverEstimateService.updateEstimateStatus({
        estimateId,
        moverId,
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
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const estimateId = req.query.estimateId as string;
      const { price, comment } = req.body;

      if (!moverId || typeof moverId !== "string") {
        res.status(401).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(403).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateId || typeof estimateId !== "string") {
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
        !comment ||
        typeof comment !== "string" ||
        comment.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "견적 코멘트를 입력해주세요.",
        });
        return;
      }

      // 코멘트 길이 제한 (예: 1000자)
      if (comment.length > 1000) {
        res.status(400).json({
          success: false,
          message: "견적 코멘트는 1000자 이내로 입력해주세요.",
        });
        return;
      }

      const result = await moverEstimateService.updateEstimate({
        estimateId,
        moverId,
        price,
        comment: comment.trim(),
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

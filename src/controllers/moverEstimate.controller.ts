import { NextFunction, Request, Response } from "express";
import moverEstimateService from "../services/moverEstimate.service";
import { NotFoundError } from "../types/commonError.types";
import {
  HTTP_STATUS,
  MoverEstimateDuplicateError,
  MoverEstimateQuotaExceededError,
  MoverInvalidEstimateRequestError,
  MoverExpiredEstimateRequestError,
  MoverUnauthorizedAccessError,
  MoverInvalidEstimateStatusError,
  MoverNoServiceAreaError,
  MoverNoDesignatedRequestError,
  ServiceError,
  ServiceValidationError,
  ControllerAuthError,
  ControllerValidationError,
  RepositoryError,
} from "../types/errors.types";

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

      // 기본 인증 확인
      if (!moverId || typeof moverId !== "string") {
        throw new ControllerAuthError("유효하지 않은 사용자 정보입니다");
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        throw new MoverUnauthorizedAccessError();
      }

      const result = await moverEstimateService.createEstimate({
        estimateRequestId,
        moverId,
        price,
        comment,
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "견적 생성 성공",
        data: result,
      });
    } catch (error) {
      // 구조화된 에러 처리
      if (
        error instanceof ControllerAuthError ||
        error instanceof MoverUnauthorizedAccessError
      ) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      if (
        error instanceof ServiceValidationError ||
        error instanceof MoverEstimateDuplicateError ||
        error instanceof MoverEstimateQuotaExceededError ||
        error instanceof MoverInvalidEstimateRequestError ||
        error instanceof MoverExpiredEstimateRequestError ||
        error instanceof MoverInvalidEstimateStatusError ||
        error instanceof MoverNoServiceAreaError ||
        error instanceof MoverNoDesignatedRequestError
      ) {
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "반려 사유를 입력해주세요.",
        });
        return;
      }

      // 코멘트 길이 제한 (예: 500자)
      if (comment.length > 500) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "견적 반려 성공",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        // 비즈니스 로직 에러는 400 Bad Request로 처리
        if (
          error.message === "이미 견적을 작성했습니다." ||
          error.message === "견적 요청을 찾을 수 없습니다." ||
          error.message === "활성 상태가 아닌 견적 요청입니다." ||
          error.message === "이사일이 지난 견적 요청입니다."
        ) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      // 정렬 옵션 검증
      if (sortBy && !["moveDate", "createdAt"].includes(sortBy as string)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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

      res.status(HTTP_STATUS.OK).json({
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      // 정렬 옵션 검증
      if (sortBy && !["moveDate", "createdAt"].includes(sortBy as string)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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

      res.status(HTTP_STATUS.OK).json({
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      // region/designated 쿼리 파싱 (문자열 true/false)
      const regionBool = region === "true";
      const designatedBool = designated === "true";

      if (!regionBool && !designatedBool) {
        res.status(HTTP_STATUS.OK).json({
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

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "견적 통합 조회 성공",
        data: result,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "유효하지 않은 견적 요청 ID입니다.",
        });
        return;
      }

      const result =
        await moverEstimateService.getEstimateRequestById(estimateRequestId);
      res.status(HTTP_STATUS.OK).json({
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      const result = await moverEstimateService.getMyEstimate(moverId);
      res.status(HTTP_STATUS.OK).json({
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      const result = await moverEstimateService.getMyRejectedEstimates(moverId);

      res.status(HTTP_STATUS.OK).json({
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
      const moverId = req.user?.userId;
      const userType = req.user?.userType;
      const estimateId = req.query.estimateId as string;
      const { status } = req.body;

      if (!moverId || typeof moverId !== "string") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateId || typeof estimateId !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "유효하지 않은 견적서 ID입니다.",
        });
        return;
      }

      if (
        !status ||
        !["PROPOSED", "ACCEPTED", "REJECTED", "AUTO_REJECTED"].includes(status)
      ) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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

      res.status(HTTP_STATUS.OK).json({
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
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "유효하지 않은 사용자 정보입니다.",
        });
        return;
      }

      // 무버 권한 확인
      if (userType !== "MOVER") {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "현재 유저타입이 기사가 아닙니다.",
        });
        return;
      }

      if (!estimateId || typeof estimateId !== "string") {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "유효하지 않은 견적서 ID입니다.",
        });
        return;
      }

      if (!price || typeof price !== "number" || price < 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "견적 코멘트를 입력해주세요.",
        });
        return;
      }

      // 코멘트 길이 제한 (예: 1000자)
      if (comment.length > 1000) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
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

      res.status(HTTP_STATUS.OK).json({
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

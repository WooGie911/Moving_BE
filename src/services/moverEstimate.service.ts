import moverEstimateRepository from "../repositories/moverEstimate.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  TCreateEstimateRequest,
  TRejectEstimateRequest,
  TUpdateEstimateRequest,
  TUpdateEstimateStatusRequest,
  TQuoteResponse,
  TEstimateResponse,
  TMyEstimateResponse,
  TMyRejectedQuoteResponse,
} from "../types/moverEstimate";

const moverEstimateService = {
  // 견적 생성
  createEstimate: async (
    data: TCreateEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      const estimate = await moverEstimateRepository.createEstimate(
        data.quoteId,
        data.userId,
        data.price,
        data.description
      );
      if (!estimate) {
        throw new NotFoundError("견적 생성에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        // 비즈니스 로직 에러는 그대로 전달
        if (
          error.message === "이미 견적을 작성했습니다." ||
          error.message === "견적 요청을 찾을 수 없습니다." ||
          error.message === "활성 상태가 아닌 견적 요청입니다." ||
          error.message === "이사일이 지난 견적 요청입니다."
        ) {
          throw error;
        }
      }
      throw new Error("견적 생성 중 오류가 발생했습니다.");
    }
  },

  // 견적 반려
  rejectEstimate: async (
    data: TRejectEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      const estimate = await moverEstimateRepository.rejectEstimate(
        data.quoteId,
        data.userId,
        data.description
      );
      if (!estimate) {
        throw new NotFoundError("견적 반려에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        // 비즈니스 로직 에러는 그대로 전달
        if (
          error.message === "이미 견적을 작성했습니다." ||
          error.message === "견적 요청을 찾을 수 없습니다." ||
          error.message === "활성 상태가 아닌 견적 요청입니다." ||
          error.message === "이사일이 지난 견적 요청입니다."
        ) {
          throw error;
        }
      }
      throw new Error("견적 반려 중 오류가 발생했습니다.");
    }
  },

  // 서비스 가능 지역 견적 조회
  getRegionQuote: async (
    availableRegion: string,
    sortBy?: "movingDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ): Promise<TQuoteResponse[] | null> => {
    const quotes = await moverEstimateRepository.getRegionQuote(
      availableRegion,
      sortBy,
      customerName,
      movingType
    );

    if (!quotes || quotes.length === 0) {
      throw new NotFoundError("해당 지역의 견적이 없습니다.");
    }

    return quotes;
  },

  // 지정 견적 조회
  getDesignatedQuote: async (
    moverId: number,
    sortBy?: "movingDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ): Promise<TQuoteResponse[] | null> => {
    const quotes = await moverEstimateRepository.getDesignatedQuote(
      moverId,
      sortBy,
      customerName,
      movingType
    );

    if (!quotes || quotes.length === 0) {
      throw new NotFoundError("지정 견적이 없습니다.");
    }

    return quotes;
  },

  // 지역/지정 견적 통합 조회
  getAllQuotes: async (
    userId: number,
    options: {
      region: boolean;
      designated: boolean;
      availableRegion?: string;
      sortBy?: "movingDate" | "createdAt";
      customerName?: string;
      movingType?: "SMALL" | "HOME" | "OFFICE";
    }
  ): Promise<{
    regionQuotes?: TQuoteResponse[];
    designatedQuotes?: TQuoteResponse[];
  }> => {
    const {
      region,
      designated,
      availableRegion,
      sortBy,
      customerName,
      movingType,
    } = options;

    let regionQuotes: TQuoteResponse[] = [];
    let designatedQuotes: TQuoteResponse[] = [];

    if (region && availableRegion) {
      regionQuotes =
        (await moverEstimateService.getRegionQuote(
          availableRegion,
          sortBy,
          customerName,
          movingType
        )) || [];
    }
    if (designated) {
      designatedQuotes =
        (await moverEstimateService.getDesignatedQuote(
          userId,
          sortBy,
          customerName,
          movingType
        )) || [];
    }
    return {
      regionQuotes: region ? regionQuotes : undefined,
      designatedQuotes: designated ? designatedQuotes : undefined,
    };
  },

  // 견적 상세 조회
  getQuoteById: async (quoteId: number): Promise<TQuoteResponse | null> => {
    const quote = await moverEstimateRepository.getQuoteById(quoteId);
    if (!quote) {
      throw new NotFoundError("견적을 찾을 수 없습니다.");
    }
    return quote;
  },

  // 내가 보낸 견적서 조회
  getMyEstimate: async (
    userId: number
  ): Promise<TMyEstimateResponse[] | null> => {
    const estimates = await moverEstimateRepository.getMyEstimate(userId);
    if (!estimates || estimates.length === 0) {
      throw new NotFoundError("보낸 견적서가 없습니다.");
    }
    return estimates;
  },

  // 내가 반려한 견적 조회
  getMyRejectedQuotes: async (
    userId: number
  ): Promise<TMyRejectedQuoteResponse[] | null> => {
    const rejectedQuotes =
      await moverEstimateRepository.getMyRejectedQuotes(userId);
    if (!rejectedQuotes || rejectedQuotes.length === 0) {
      throw new NotFoundError("반려한 견적이 없습니다.");
    }
    return rejectedQuotes;
  },

  // 견적 상태 업데이트
  updateEstimateStatus: async (
    data: TUpdateEstimateStatusRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      const estimate = await moverEstimateRepository.updateEstimateStatus(
        data.estimateId,
        data.userId, // userId를 moverId로 사용
        data.status
      );
      if (!estimate) {
        throw new NotFoundError("견적 상태 업데이트에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "해당 견적에 대한 권한이 없습니다.") {
          throw error;
        }
      }
      throw new Error("견적 상태 업데이트 중 오류가 발생했습니다.");
    }
  },

  // 견적서 업데이트
  updateEstimate: async (
    data: TUpdateEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      const estimate = await moverEstimateRepository.updateEstimatePrice(
        data.estimateId,
        data.userId, // userId를 moverId로 사용
        data.price,
        data.description
      );
      if (!estimate) {
        throw new NotFoundError("견적서 업데이트에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "해당 견적에 대한 권한이 없습니다." ||
          error.message === "수정 가능한 상태가 아닙니다."
        ) {
          throw error;
        }
      }
      throw new Error("견적서 업데이트 중 오류가 발생했습니다.");
    }
  },
};

export default moverEstimateService;

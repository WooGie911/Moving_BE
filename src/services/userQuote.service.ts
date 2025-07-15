import userQuoteRepository from "../repositories/userQuote.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  TPendingQuoteResponse,
  TReceivedQuoteResponse,
  TQuoteDetailResponse,
  TConfirmEstimateResponse,
  TDesignateQuoteResponse,
  TDesignatedEstimateRequest,
  TQuoteHistoryResponse,
} from "../types/userQuote";

const userQuoteService = {
  // 진행중인 견적 조회
  getPendingQuote: async (userId: number): Promise<TPendingQuoteResponse> => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    const data = await userQuoteRepository.getPendingQuote(activeQuoteId);
    if (!data) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    const {
      id,
      movingType,
      createdAt,
      departureAddr,
      arrivalAddr,
      departureDetail,
      status,
      confirmedEstimateId,
      estimateCount,
      designatedEstimateCount,
      estimates,
    } = data;

    const quote = {
      id,
      movingType,
      createdAt,
      departureAddr,
      arrivalAddr,
      departureDetail,
      status,
      confirmedEstimateId,
      estimateCount,
      designatedEstimateCount,
    };

    return {
      quote,
      estimates: estimates ?? [],
    };
  },

  // 완료된 견적 조회
  getReceivedQuotes: async (
    userId: number
  ): Promise<TReceivedQuoteResponse[]> => {
    const result = await userQuoteRepository.getReceivedQuotes(userId);
    if (!result || result.length === 0) {
      throw new NotFoundError("완료된 견적이 없습니다.");
    }

    const quotes = result.map((data) => {
      const {
        id,
        movingType,
        createdAt,
        departureAddr,
        arrivalAddr,
        departureDetail,
        status,
        confirmedEstimateId,
        estimateCount,
        designatedEstimateCount,
        estimates,
      } = data;

      const quote = {
        id,
        movingType,
        createdAt,
        departureAddr,
        arrivalAddr,
        departureDetail,
        status,
        confirmedEstimateId,
        estimateCount,
        designatedEstimateCount,
      };

      return {
        quote,
        estimates: estimates ?? [],
      };
    });

    return quotes;
  },

  // 진행중인 견적 상세 조회
  getPendingQuoteDetail: async (
    userId: number,
    estimateId: number
  ): Promise<TQuoteDetailResponse> => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    const result = await userQuoteRepository.getPendingQuoteDetail(
      activeQuoteId,
      estimateId
    );
    if (!result) {
      throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
    }

    // Record<string, any>를 QuoteDetailResponse로 변환
    return {
      id: result.id,
      price: result.price,
      description: result.description,
      status: result.status,
      isDesignated: result.isDesignated,
      mover: result.mover,
    };
  },

  // 완료된 견적 상세 조회
  getReceivedQuoteDetail: async (
    userId: number,
    estimateId: number,
    quoteId: number
  ): Promise<TQuoteDetailResponse> => {
    const result = await userQuoteRepository.getReceivedQuoteDetail(
      userId,
      estimateId,
      quoteId
    );
    if (!result) {
      throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
    }

    // Record<string, any>를 QuoteDetailResponse로 변환
    return {
      id: result.id,
      price: result.price,
      description: result.description,
      status: result.status,
      isDesignated: result.isDesignated,
      mover: result.mover,
    };
  },

  // 견적 확정
  confirmEstimate: async (
    userId: number,
    estimateId: number
  ): Promise<TConfirmEstimateResponse> => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    const result = await userQuoteRepository.confirmEstimate(
      userId,
      estimateId
    );
    if (!result) {
      throw new NotFoundError("견적 확정에 실패했습니다.");
    }

    return result;
  },

  // 6. 지정 견적 요청
  designateQuote: async (
    quoteId: number,
    userId: number,
    message: string,
    moverId: number
  ): Promise<TDesignatedEstimateRequest> => {
    const result = await userQuoteRepository.designateQuote(
      quoteId,
      userId,
      message,
      moverId
    );
    if (!result) {
      throw new NotFoundError("지정 견적 요청에 실패했습니다.");
    }
    return result;
  },

  // 7. 이용 내역 조회
  getQuoteHistory: async (userId: number): Promise<TQuoteHistoryResponse[]> => {
    const result = await userQuoteRepository.getQuoteHistory(userId);
    return result;
  },
};

export default userQuoteService;

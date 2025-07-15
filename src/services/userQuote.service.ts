import userQuoteRepository from "../repositories/userQuote.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  PendingQuoteResponse,
  ReceivedQuoteResponse,
  QuoteDetailResponse,
  ConfirmEstimateResponse,
  DesignateQuoteResponse,
} from "../types/userQuote";

const userQuoteService = {
  // 진행중인 견적 조회
  getPendingQuote: async (userId: number): Promise<PendingQuoteResponse> => {
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
  ): Promise<ReceivedQuoteResponse[]> => {
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
  ): Promise<QuoteDetailResponse> => {
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
  ): Promise<QuoteDetailResponse> => {
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
  ): Promise<ConfirmEstimateResponse> => {
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

  // 지정 견적 요청
  designateQuote: async (
    quoteId: number,
    userId: number,
    message: string,
    moverId: number
  ): Promise<DesignateQuoteResponse> => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    // moverId 유효성 검증 (mover가 존재하고 MOVER 역할인지 확인)
    const mover = await userQuoteRepository.getMoverById(moverId);
    if (!mover || mover.currentRole !== "MOVER") {
      throw new NotFoundError("유효하지 않은 기사님입니다.");
    }

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
};

export default userQuoteService;

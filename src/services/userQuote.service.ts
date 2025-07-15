import userQuoteRepository from "../repositories/userQuote.repository";
import { NotFoundError } from "../types/commonError.types";

const userQuoteService = {
  getPendingQuote: async (userId: number) => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    const data = await userQuoteRepository.getPendingQuote(activeQuoteId);
    if (!data) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    const {
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

  getReceivedQuotes: async (userId: number) => {
    const result = await userQuoteRepository.getReceivedQuotes(userId);
    if (!result || result.length === 0) {
      throw new NotFoundError("완료된 견적이 없습니다.");
    }

    const quotes = result.map((data) => {
      const {
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

  getPendingQuoteDetail: async (userId: number, estimateId: number) => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    const result = await userQuoteRepository.getPendingQuoteDetail(activeQuoteId, estimateId);
    if (!result) {
      throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
    }
    return result;
  },

  getReceivedQuoteDetail: async (userId: number, estimateId: number, quoteId: number) => {
    const result = await userQuoteRepository.getReceivedQuoteDetail(userId, estimateId, quoteId);
    if (!result) {
      throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
    }

    return result;
  },

  confirmEstimate: async (userId: number, estimateId: number) => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    return await userQuoteRepository.confirmEstimate(userId, estimateId);
  },

  designateQuote: async (quoteId: number, userId: number, message: string, moverId: number) => {
    const activeQuoteId = await userQuoteRepository.getActiveQuote(userId);
    if (!activeQuoteId) {
      throw new NotFoundError("진행중인 견적이 없습니다.");
    }

    // moverId 유효성 검증 (mover가 존재하고 MOVER 역할인지 확인)
    const mover = await userQuoteRepository.getMoverById(moverId);
    if (!mover || mover.currentRole !== "MOVER") {
      throw new NotFoundError("유효하지 않은 기사님입니다.");
    }

    return await userQuoteRepository.designateQuote(quoteId, userId, message, moverId);
  },
};

export default userQuoteService;

import userQuoteRepository from "../repositories/userQuote.repositort";
import { NotFoundError } from "../types/commonError.types";

const getPendingQuote = async (userId: number) => {
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
};

const getReceivedQuotes = async (userId: number) => {
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
};

const getPendingQuoteDetail = async (userId: number, estimateId: number) => {
  const result = await userQuoteRepository.getPendingQuoteDetail(
    userId,
    estimateId
  );
  if (!result) {
    throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
  }
  return result;
};

const getReceivedQuoteDetail = async (
  userId: number,
  estimateId: number,
  quoteId: number
) => {
  const result = await userQuoteRepository.getReceivedQuoteDetail(
    userId,
    estimateId,
    quoteId
  );
  if (!result) {
    throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
  }

  return result;
};

const confirmEstimate = async (userId: number, estimateId: number) => {
  const result = await userQuoteRepository.confirmEstimate(userId, estimateId);
  if (!result) {
    throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
  }

  return await userQuoteRepository.confirmEstimate(userId, estimateId);
};

const designateQuote = async (
  quoteId: number,
  userId: number,
  message: string,
  moverId: number
) => {
  return await userQuoteRepository.designateQuote(
    quoteId,
    userId,
    message,
    moverId
  );
};

export default {
  getPendingQuote,
  getReceivedQuotes,
  getPendingQuoteDetail,
  getReceivedQuoteDetail,
  confirmEstimate,
  designateQuote,
};

import userQuoteRepository from "../repositories/userQuote.repositort";
import { NotFoundError } from "../types/commonError";

const getPendingQuote = async (userId: number) => {
  const result = await userQuoteRepository.getPendingQuote(userId);
  if (!result) {
    // 비즈니스 에러 처리
    throw new NotFoundError("진행중인 견적이 없습니다.");
  }
  const { estimates, ...quote } = result;
  return result;
};

const getReceivedQuotes = async (userId: number) => {
  const result = await userQuoteRepository.getReceivedQuotes(userId);
  if (!result || result.length === 0) {
    throw new NotFoundError("완료된 견적이 없습니다.");
  }

  // 각 quote에서 estimates 분리
  const formatted = result.map(({ estimates, ...quote }) => ({
    quote,
    estimates,
  }));

  return formatted;
};

const getPendingQuoteDetail = async (userId: number, estimateId: number) => {
  return await userQuoteRepository.getPendingQuoteDetail(userId, estimateId);
};

const getReceivedQuoteDetail = async (
  userId: number,
  estimateId: number,
  quoteId: number
) => {
  return await userQuoteRepository.getReceivedQuoteDetail(
    userId,
    estimateId,
    quoteId
  );
};

const confirmEstimate = async (userId: number, estimateId: number) => {
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

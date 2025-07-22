import type {
  MoverListFilter,
  DesignatedQuoteRequestDto,
} from "../types/mover.types";
import {
  getMoverList,
  getFavoriteMovers,
  getMoverDetail,
  createDesignatedEstimateRequest,
  checkDesignatedEstimateRequest,
} from "../repositories/mover.repository";

/**
 * 기사님 리스트 조회
 */
export const fetchMoverList = async (filter: MoverListFilter) => {
  return await getMoverList(filter);
};

/**
 * 찜한 기사님 리스트 조회
 */
export const fetchFavoriteMovers = async (customerId: string) => {
  return await getFavoriteMovers(customerId);
};

/**
 * 기사님 상세 조회
 */
export const fetchMoverDetail = async (id: string) => {
  return await getMoverDetail(id);
};

/**
 * 지정 견적 요청 생성
 */
export const requestDesignatedQuote = async (
  dto: DesignatedQuoteRequestDto
) => {
  return await createDesignatedEstimateRequest(dto);
};

/**
 * 지정 견적 요청 여부 조회
 */
export const checkDesignatedQuoteRequest = async (params: {
  quoteId: string;
  moverId: string;
}) => {
  return await checkDesignatedEstimateRequest(params);
};

export default {
  fetchMoverList,
  fetchFavoriteMovers,
  fetchMoverDetail,
  requestDesignatedQuote,
  checkDesignatedQuoteRequest,
};

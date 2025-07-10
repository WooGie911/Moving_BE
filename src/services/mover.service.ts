import {
  getMoverList,
  getBookmarkedMovers,
} from "../repositories/mover.repository";
import { IMoverListFilter } from "../types/mover.types";

/**
 * 기사님 리스트 조회 (필터, 정렬, 키워드)
 */
export const fetchMoverList = async (filter: IMoverListFilter) => {
  return getMoverList(filter);
};

/**
 * 찜한 기사님 조회
 */
export const fetchBookmarkedMovers = async (userId: number) => {
  return getBookmarkedMovers(userId);
};

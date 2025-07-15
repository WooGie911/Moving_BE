import {
  getMoverList,
  getFavoriteMovers,
} from "../repositories/mover.repository";
import { IMoverListFilter } from "../types/mover.types";

/**
 * 기사님 리스트 조회 (필터, 정렬, 키워드)
 */
export const fetchMoverList = async (filter: IMoverListFilter) => {
  const movers = await getMoverList(filter);

  return movers;
};

/**
 * 찜한 기사님 조회
 */
export const fetchFavoriteMovers = async (userId: number) => {
  const movers = await getFavoriteMovers(userId);

  return movers;
};

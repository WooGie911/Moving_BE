import { Request, Response, NextFunction } from "express";
import { fetchMoverList, fetchFavoriteMovers } from "../services/mover.service";
import { IMoverListFilter } from "../types/mover.types";
import { handleError } from "../utils/handleError";

/**
 * 기사님 리스트 조회 (필터, 정렬, 키워드)
 */
export const getMoverListController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, serviceTypeId, search, sort, cursor, take } = req.query;

    const filter: IMoverListFilter = {
      region: region as any,
      serviceTypeId: serviceTypeId ? Number(serviceTypeId) : undefined,
      search: search as string,
      sort: sort as any,
      cursor: cursor ? Number(cursor) : undefined,
      take: take ? Number(take) : undefined,
    };

    const movers = await fetchMoverList(filter);
    res.json({
      success: true,
      message: "기사님 목록을 성공적으로 조회했습니다.",
      data: movers,
    });
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * 찜한 기사님 조회
 */
export const getFavoriteMoversController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.user as { userId: number };
    const favoriteMovers = await fetchFavoriteMovers(userId);
    res.json({
      success: true,
      message: "찜한 기사님 목록을 성공적으로 조회했습니다.",
      data: favoriteMovers,
    });
  } catch (err) {
    handleError(res, err);
  }
};

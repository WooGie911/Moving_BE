import { Request, Response, NextFunction } from "express";
import { fetchMoverList, fetchFavoriteMovers } from "../services/mover.service";
import { IMoverListFilter } from "../types/mover.types";
import { handleError } from "../utils/handleError";
import moverService from "../services/mover.service";

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

export const getMoverDetailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.moverId);
    if (!id) return res.status(400).json({ success: false, message: "id가 필요합니다.", data: null });
    const mover = await moverService.fetchMoverDetail(id);
    if (!mover) return res.status(404).json({ success: false, message: "존재하지 않는 기사님", data: null });
    res.json({ success: true, message: "기사님 상세 조회 성공", data: mover });
  } catch (err) {
    next(err);
  }
};

const moverController = {
  getMoverListController,
  getFavoriteMoversController,
  getMoverDetailController,
};

export default moverController;

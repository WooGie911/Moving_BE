import { Request, Response, NextFunction } from "express";
import {
  fetchMoverList,
  fetchBookmarkedMovers,
} from "../services/mover.service";
import { IMoverListFilter } from "../types/mover.types";
import { NotFoundError, AuthenticationError } from "../types/commonError";
import { handleError } from "../utils/handleError";

/**
 * 기사님 리스트 조회 (필터, 정렬, 키워드)
 */
export const getMoverListController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    if (!movers || movers.length === 0) {
      throw new NotFoundError("조회된 기사님이 없습니다.");
    }

    res.json({ success: true, data: movers });
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * 찜한 기사님 조회
 */
export const getBookmarkedMoversController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: 실제 인증된 사용자 ID를 가져오는 로직으로 변경 필요
    const userId = 1;

    // 인증 실패 (추후 미들웨어 적용 시)
    // if (!userId) throw new AuthenticationError("인증이 필요합니다.");

    const bookmarkedMovers = await fetchBookmarkedMovers(userId);

    if (!bookmarkedMovers || bookmarkedMovers.length === 0) {
      throw new NotFoundError("찜한 기사님이 없습니다.");
    }

    res.json({ success: true, data: bookmarkedMovers });
  } catch (err) {
    handleError(res, err);
  }
};

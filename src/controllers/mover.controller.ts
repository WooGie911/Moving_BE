import { Request, Response, NextFunction } from "express";
import moverService from "../services/mover.service";

const ALLOWED_SORT = ["rating", "career", "confirmed", "review"];

/**
 * 기사님 리스트 조회
 */
export const getMoverListController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { region, serviceTypeId, search, sort, cursor, take } = req.query;
    region = region ? String(region) : undefined;
    serviceTypeId = serviceTypeId ? String(serviceTypeId) : undefined;
    search = search ? String(search) : undefined;
    sort =
      sort && ALLOWED_SORT.includes(String(sort)) ? String(sort) : "review";
    cursor = cursor ? String(cursor) : undefined;
    let takeNum: number | undefined = undefined;
    if (take !== undefined) {
      const parsed = Number(take);
      if (!isNaN(parsed)) takeNum = parsed;
    }

    const filter = {
      region,
      serviceType: serviceTypeId,
      search,
      sort,
      cursor,
      take: takeNum,
    };
    const { items, nextCursor, hasNext } =
      await moverService.fetchMoverList(filter);
    res.json({
      success: true,
      message: "기사님 목록을 성공적으로 조회했습니다.",
      data: {
        items,
        nextCursor,
        hasNext,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 찜한 기사님 리스트 조회
 */
export const getFavoriteMoversController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.user as { userId: string | number };
    const favoriteMovers = await moverService.fetchFavoriteMovers(
      String(userId)
    );
    res.json({
      success: true,
      message: "찜한 기사님 목록을 성공적으로 조회했습니다.",
      data: favoriteMovers,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 기사님 상세 조회
 */
export const getMoverDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.moverId);
    const userId = req.user?.userId;

    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "id가 필요합니다.", data: null });

    const mover = await moverService.fetchMoverDetail(id, userId);
    if (!mover)
      return res
        .status(404)
        .json({ success: false, message: "존재하지 않는 기사님", data: null });

    res.json({ success: true, message: "기사님 상세 조회 성공", data: mover });
  } catch (err) {
    next(err);
  }
};

/**
 * 지정 견적 요청 생성
 */
export const postDesignatedQuoteRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { moverId } = req.params;
    const { quoteId, message, expiresAt } = req.body;
    const user = req.user as {
      userId: string;
      name: string;
      userType: string | string[];
    };

    // userType이 문자열이거나 배열일 수 있으므로 둘 다 처리
    const userTypes = Array.isArray(user.userType)
      ? user.userType
      : [user.userType];

    if (!user || !userTypes.includes("CUSTOMER")) {
      return res.status(401).json({
        success: false,
        message: "회원만 지정 견적 요청이 가능합니다.",
      });
    }
    if (!quoteId || !expiresAt) {
      return res.status(400).json({ success: false, message: "필수값 누락" });
    }
    const request = await moverService.requestDesignatedQuote({
      quoteId: String(quoteId),
      moverId: String(moverId),
      message,
      expiresAt: new Date(expiresAt),
    });
    if (!request) {
      return res.json({
        success: false,
        message: "이미 해당 기사님에게 지정 견적을 요청하셨습니다.",
        data: null,
      });
    }
    res.json({
      success: true,
      message: "지정 견적 요청이 성공적으로 생성되었습니다.",
      data: request,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * 지정 견적 요청 여부 조회
 */
export const getDesignatedQuoteRequestCheckController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { moverId } = req.params;
    const { quoteId } = req.query;
    const user = req.user as {
      userId: string;
      name: string;
      userType: string | string[];
    };

    const userTypes = Array.isArray(user.userType)
      ? user.userType
      : [user.userType];

    if (!user || !userTypes.includes("CUSTOMER")) {
      return res.status(401).json({
        success: false,
        message: "회원만 지정 견적 요청 조회가 가능합니다.",
      });
    }

    if (!quoteId) {
      return res.status(400).json({
        success: false,
        message: "quoteId가 필요합니다.",
      });
    }

    const request = await moverService.checkDesignatedQuoteRequest({
      quoteId: String(quoteId),
      moverId: String(moverId),
    });

    // 반려된 경우도 요청한 것으로 간주
    const hasRequested = !!request;

    res.json({
      success: true,
      message: "지정 견적 요청 여부 조회 성공",
      data: {
        hasRequested: hasRequested,
        status: request?.status || null,
        requestId: request?.id || null,
        message: request?.message || null,
        expiresAt: request?.expiresAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 이사일이 지나지 않은 견적 확인
 */
export const checkActiveEstimateRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as {
      userId: string;
      name: string;
      userType: string | string[];
    };

    // userType이 문자열이거나 배열일 수 있으므로 둘 다 처리
    const userTypes = Array.isArray(user.userType)
      ? user.userType
      : [user.userType];

    if (!user || !userTypes.includes("CUSTOMER")) {
      return res.status(401).json({
        success: false,
        message: "회원만 확인이 가능합니다.",
      });
    }

    const estimateRequestService = new (
      await import("../services/estimateRequest.service")
    ).default();
    const hasActiveRequest =
      await estimateRequestService.hasActiveRequestBeforeMoveDate(user.userId);

    res.json({
      success: true,
      message: "이사일이 지나지 않은 견적 확인 성공",
      data: {
        hasActiveRequest,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getMoverListController,
  getFavoriteMoversController,
  getMoverDetailController,
  postDesignatedQuoteRequestController,
  getDesignatedQuoteRequestCheckController,
  checkActiveEstimateRequestController,
};

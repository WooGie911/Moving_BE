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
  const result = await getMoverList(filter);

  const transformedItems = result.items.map((mover) => ({
    id: mover.id,
    userId: 0,
    nickname: mover.nickname || "",
    profileImage: null, 
    experience: mover.career || 0,
    introduction: mover.shortIntro || "",
    description: mover.detailIntro || "",
    completedCount: mover.workedCount || 0,
    avgRating: mover.averageRating || 0,
    reviewCount: mover.totalReviewCount || 0,
    favoriteCount: mover.favorites?.length || 0,
    lastActivityAt: null, 
    user: {
      id: 0,
      name: mover.name,
      email: "",
    },
    serviceRegions: mover.serviceAreas || [],
    serviceTypes: (mover.serviceTypes || []).map((serviceType) => ({
      service: {
        name:
          serviceType === "SMALL"
            ? "소형이사"
            : serviceType === "HOME"
              ? "가정이사"
              : serviceType === "OFFICE"
                ? "사무실이사"
                : "기타",
      },
    })),
  }));

  return {
    items: transformedItems,
    nextCursor: result.nextCursor,
    hasNext: result.hasNext,
  };
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
  const mover = await getMoverDetail(id);

  if (!mover) return null;

  return {
    id: mover.id,
    userId: 0,
    nickname: mover.nickname || "",
    profileImage: null, 
    experience: mover.career || 0,
    introduction: mover.shortIntro || "",
    description: mover.detailIntro || "",
    completedCount: mover.workedCount || 0,
    avgRating: mover.averageRating || 0,
    reviewCount: mover.totalReviewCount || 0,
    favoriteCount: mover.favorites?.length || 0,
    lastActivityAt: null, 
    user: {
      id: 0,
      name: mover.name,
      email: "",
    },
    serviceRegions: mover.serviceAreas || [],
    serviceTypes: (mover.serviceTypes || []).map((serviceType) => ({
      service: {
        name:
          serviceType === "SMALL"
            ? "소형이사"
            : serviceType === "HOME"
              ? "가정이사"
              : serviceType === "OFFICE"
                ? "사무실이사"
                : "기타",
      },
    })),
  };
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

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
  checkEstimateRequestStatus,
} from "../repositories/mover.repository";
import actionService from "./action.service";
import { ActionType } from "@prisma/client";
import estimateRequestRepository from "../repositories/estimateRequest.repository";
import * as Sentry from "@sentry/node";

/**
 * 기사님 리스트 조회
 */
export const fetchMoverList = async (filter: MoverListFilter) => {
  try {
    Sentry.setContext("MoverListService", {
      filter: JSON.stringify(filter),
    });

    const result = await getMoverList(filter);

    const transformedItems = result.items.map((mover) => ({
      id: mover.id,
      userId: 0,
      nickname: mover.nickname || "",
      profileImage: mover.moverImage || null,
      experience: mover.career || 0,
      introduction: mover.shortIntro || "",
      description: mover.detailIntro || "",
      completedCount: mover.workedCount || 0,
      avgRating: mover.averageRating || 0,
      reviewCount: mover.totalReviewCount || 0,
      favoriteCount: (mover.Favorite || []).filter(
        (fav) => fav.deletedAt === null
      ).length,
      lastActivityAt: null,
      user: {
        id: 0,
        name: mover.name,
        email: "",
      },
      serviceRegions: mover.currentAreas || [],
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
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        operation: "fetchMoverList",
        filter: JSON.stringify(filter),
      },
      tags: {
        service: "mover",
        action: "fetchMoverList",
      },
    });
    throw error;
  }
};

/**
 * 찜한 기사님 리스트 조회
 */
export const fetchFavoriteMovers = async (customerId: string) => {
  const movers = await getFavoriteMovers(customerId);
  return (movers || []).map((mover) => ({
    id: mover.id,
    userId: 0,
    nickname: mover.nickname || "",
    profileImage: mover.moverImage || null,
    experience: mover.career || 0,
    introduction: mover.shortIntro || "",
    description: mover.detailIntro || "",
    completedCount: mover.workedCount || 0,
    avgRating: mover.averageRating || 0,
    reviewCount: mover.totalReviewCount || 0,
    favoriteCount: mover.favoriteCount || 0,
    lastActivityAt: null,
    user: {
      id: 0,
      name: mover.name,
      email: "",
    },
    serviceRegions: mover.currentAreas || [],
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
};

/**
 * 기사님 상세 조회
 */
export const fetchMoverDetail = async (id: string, userId?: string) => {
  try {
    Sentry.setContext("MoverDetailService", {
      moverId: id,
      userId: userId || "anonymous",
    });

    const mover = await getMoverDetail(id, userId);

    if (!mover) return null;

    return {
      id: mover.id,
      userId: 0,
      nickname: mover.nickname || "",
      profileImage: mover.moverImage || null,
      experience: mover.career || 0,
      introduction: mover.shortIntro || "",
      description: mover.detailIntro || "",
      completedCount: mover.workedCount || 0,
      avgRating: mover.averageRating || 0,
      reviewCount: mover.totalReviewCount || 0,
      favoriteCount: mover.favoriteCount || 0,
      isFavorited: mover.isFavorited || false,
      lastActivityAt: null,
      user: {
        id: 0,
        name: mover.name,
        email: "",
      },
      serviceRegions: mover.currentAreas || [],
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
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        operation: "fetchMoverDetail",
        moverId: id,
        userId: userId || "anonymous",
      },
      tags: {
        service: "mover",
        action: "fetchMoverDetail",
      },
    });
    throw error;
  }
};

/**
 * 지정 견적 요청 생성
 */
export const requestDesignatedQuote = async (
  dto: DesignatedQuoteRequestDto
) => {
  // 견적 상태 확인
  const statusCheck = await checkEstimateRequestStatus(dto.quoteId);
  if (!statusCheck.isValid) {
    throw new Error(statusCheck.reason);
  }

  const designatedRequest = await createDesignatedEstimateRequest(dto);

  // 지정 견적 요청 액션 생성
  if (designatedRequest) {
    const estimateRequest =
      await estimateRequestRepository.getEstimateRequestDetailForAction(
        dto.quoteId
      );
    if (estimateRequest) {
      await actionService.createAction(
        estimateRequest.customerId,
        ActionType.DESIGNATED_ESTIMATE_REQUEST_SUBMITTED,
        dto.quoteId,
        "DESIGNATED_ESTIMATE_REQUEST",
        { customerName: estimateRequest.customer?.nickname || "" }
      );
    }
  }

  return designatedRequest;
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

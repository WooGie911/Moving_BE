import { PrismaClient } from "@prisma/client";
import type {
  MoverListFilter,
  DesignatedQuoteRequestDto,
} from "../types/mover.types";
const prisma = new PrismaClient();

/**
 * 기사님 리스트 조회
 */
export const getMoverList = async (filter: MoverListFilter) => {
  const {
    region,
    serviceType,
    search,
    sort = "rating",
    cursor,
    take = 4,
  } = filter;

  const getServiceTypeEnum = (serviceTypeId: string | number) => {
    const id = Number(serviceTypeId);
    switch (id) {
      case 1:
        return "SMALL"; 
      case 2:
        return "HOME";
      case 3:
        return "OFFICE"; 
      default:
        return null;
    }
  };

  const serviceTypeEnum = serviceType ? getServiceTypeEnum(serviceType) : null;

  const where: any = {
    deletedAt: null,
    userType: { has: "MOVER" },
    ...(search && {
      OR: [{ nickname: { contains: search } }, { name: { contains: search } }],
    }),
    ...(serviceTypeEnum && {
      serviceTypes: { has: serviceTypeEnum },
    }),
    ...(region && {
      serviceAreas: {
        some: { region },
      },
    }),
  };

  const SORT_MAP: Record<string, string> = {
    rating: "averageRating",
    career: "career",
    confirmed: "workedCount",
    review: "totalReviewCount",
  };
  const orderByField = SORT_MAP[sort] || "averageRating";
  const orderBy = { [orderByField]: "desc" };

  const movers = await prisma.user.findMany({
    where,
    orderBy,
    skip: cursor ? 1 : 0,
    ...(cursor && { cursor: { id: cursor } }),
    take: take + 1,
    select: {
      id: true,
      nickname: true,
      name: true,
      career: true,
      shortIntro: true,
      detailIntro: true,
      workedCount: true,
      averageRating: true,
      totalReviewCount: true,
      serviceAreas: true,
      serviceTypes: true,
      favorites: true,
    },
  });
  const hasNext = movers.length > take;
  const items = hasNext ? movers.slice(0, take) : movers;
  const nextCursor = hasNext ? items[items.length - 1].id : null;
  return { items, nextCursor, hasNext };
};

/**
 * 기사님 상세 조회
 */
export const getMoverDetail = async (id: string) => {
  return prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      nickname: true,
      name: true,
      career: true,
      shortIntro: true,
      detailIntro: true,
      workedCount: true,
      averageRating: true,
      totalReviewCount: true,
      serviceAreas: true,
      serviceTypes: true,
      favorites: true,
    },
  });
};

/**
 * 찜한 기사님 리스트 조회
 */
export const getFavoriteMovers = async (customerId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { customerId, deletedAt: null },
    include: {
      mover: {
        include: {
          serviceAreas: true,
        },
      },
    },
  });
  return favorites.map((fav) => fav.mover);
};

/**
 * 지정 견적 요청 생성
 */
export const createDesignatedEstimateRequest = async (
  dto: DesignatedQuoteRequestDto
) => {
  const { quoteId, moverId, message, expiresAt } = dto;
  const exists = await prisma.designatedMover.findFirst({
    where: { estimateRequestId: quoteId, moverId },
  });
  if (exists) return null;
  return await prisma.designatedMover.create({
    data: {
      estimateRequestId: quoteId,
      moverId,
      message,
      expiresAt,
    },
  });
};

/**
 * 지정 견적 요청 여부 조회
 */
export const checkDesignatedEstimateRequest = async (params: {
  quoteId: string;
  moverId: string;
}) => {
  const { quoteId, moverId } = params;
  return await prisma.designatedMover.findFirst({
    where: {
      estimateRequestId: quoteId,
      moverId,
      deletedAt: null,
    },
    select: {
      id: true,
      message: true,
      expiresAt: true,
      createdAt: true,
    },
  });
};

const moverRepository = {
  getMoverList,
  getFavoriteMovers,
  getMoverDetail,
  createDesignatedEstimateRequest,
  checkDesignatedEstimateRequest,
};

export default moverRepository;

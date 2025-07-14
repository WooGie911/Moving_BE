import { PrismaClient } from "@prisma/client";
import { IMoverListFilter, TOrderByType } from "../types/mover.types";
const prisma = new PrismaClient();

/**
 * 정렬 조건 생성 함수
 */
const getOrderBy = (sort: string): TOrderByType => {
  switch (sort) {
    case "rating":
      return { avgRating: "desc" };
    case "career":
      return { experience: "desc" };
    case "confirmed":
      return { completedCount: "desc" };
    default:
      return { reviewCount: "desc" };
  }
};

/**
 * 기사님 리스트 조회 (필터, 정렬, 키워드)
 */
export const getMoverList = async (filter: IMoverListFilter) => {
  const {
    region,
    serviceTypeId,
    search,
    sort = "review",
    cursor,
    take = 20,
  } = filter;

  // 필터, 검색
  const where: any = {
    deletedAt: null,
    user: {
      currentRole: "MOVER",
      hasProfile: true,
      deletedAt: null,
    },
    ...(search && { nickname: { contains: search } }),
    ...(region && {
      serviceRegions: {
        some: { region },
      },
    }),
    ...(serviceTypeId && {
      serviceTypes: {
        some: { serviceId: serviceTypeId },
      },
    }),
  };

  // 정렬
  const orderBy = getOrderBy(sort);

  return prisma.profile.findMany({
    where,
    orderBy,
    skip: cursor ? 1 : 0,
    ...(cursor && { cursor: { id: cursor } }),
    take,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      serviceRegions: true,
      serviceTypes: { include: { service: true } },
    },
  });
};

/**
 * 찜한 기사님 조회
 */
export const getBookmarkedMovers = async (userId: number) => {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId: userId,
      mover: {
        currentRole: "MOVER",
        hasProfile: true,
        deletedAt: null,
        profile: {
          deletedAt: null,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // 유저가 찜한 시간을 기준으로 최신순 조회
    },
    take: 3,
    include: {
      mover: {
        include: {
          profile: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              serviceRegions: true,
              serviceTypes: { include: { service: true } },
            },
          },
        },
      },
    },
  });

  return favorites.map((favorite) => favorite.mover.profile);
};

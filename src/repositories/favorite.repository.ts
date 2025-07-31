import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 찜하기 추가
const addFavorite = async (customerId: string, moverId: string) => {
  return await prisma.favorite.create({
    data: {
      customerId,
      moverId,
    },
  });
};

// 찜하기 제거
const removeFavorite = async (customerId: string, moverId: string) => {
  return await prisma.favorite.delete({
    where: {
      customerId_moverId: {
        customerId,
        moverId,
      },
    },
  });
};

// 찜하기 상태 확인
const getFavoriteStatus = async (customerId: string, moverId: string) => {
  const favorite = await prisma.favorite.findUnique({
    where: {
      customerId_moverId: {
        customerId,
        moverId,
      },
    },
  });

  const favoriteCount = await prisma.favorite.count({
    where: {
      moverId,
      deletedAt: null,
    },
  });

  return {
    isFavorited: !!favorite,
    favoriteCount,
  };
};

// 기사님의 찜한 사용자 수 조회
const getMoverFavoriteCount = async (moverId: string) => {
  return await prisma.favorite.count({
    where: {
      moverId,
      deletedAt: null,
    },
  });
};

// 즐겨찾기 상세 정보 조회 (액션 메타데이터용)
const getFavoriteDetailForAction = async (favoriteId: string) => {
  const favorite = await prisma.favorite.findUnique({
    where: { id: favoriteId },
    select: {
      id: true,
      customerId: true,
      moverId: true,
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      mover: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return favorite;
};

export default {
  addFavorite,
  removeFavorite,
  getFavoriteStatus,
  getMoverFavoriteCount,
  getFavoriteDetailForAction,
};

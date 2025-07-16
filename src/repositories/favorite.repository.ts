import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 찜하기 추가
const addFavorite = async (userId: number, moverId: number) => {
  return await prisma.favorite.create({
    data: {
      userId,
      moverId,
    },
  });
};

// 찜하기 제거
const removeFavorite = async (userId: number, moverId: number) => {
  return await prisma.favorite.delete({
    where: {
      userId_moverId: {
        userId,
        moverId,
      },
    },
  });
};

// 찜하기 상태 확인
const getFavoriteStatus = async (userId: number, moverId: number) => {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_moverId: {
        userId,
        moverId,
      },
    },
  });

  const favoriteCount = await prisma.favorite.count({
    where: {
      moverId,
    },
  });

  return {
    isFavorited: !!favorite,
    favoriteCount,
  };
};

// 사용자의 찜한 기사님 목록 조회
const getUserFavorites = async (userId: number) => {
  return await prisma.favorite.findMany({
    where: {
      userId,
      mover: {
        currentRole: "MOVER",
        hasProfile: true,
        deletedAt: null,
        profile: {
          deletedAt: null,
        },
      },
    },
    include: {
      mover: {
        include: {
          profile: {
            include: {
              serviceRegions: true,
              serviceTypes: { include: { service: true } },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// 기사님의 찜한 사용자 수 조회
const getMoverFavoriteCount = async (moverId: number) => {
  return await prisma.favorite.count({
    where: {
      moverId,
    },
  });
};

export default {
  addFavorite,
  removeFavorite,
  getFavoriteStatus,
  getUserFavorites,
  getMoverFavoriteCount,
}; 
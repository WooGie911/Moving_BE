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

// 사용자의 찜한 기사님 목록 조회
const getUserFavorites = async (customerId: string) => {
  return await prisma.favorite.findMany({
    where: {
      customerId,
      deletedAt: null,
      mover: {
        deletedAt: null,
      },
    },
    include: {
      mover: {
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
          moverImage: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
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

export default {
  addFavorite,
  removeFavorite,
  getFavoriteStatus,
  getUserFavorites,
  getMoverFavoriteCount,
};

import prisma from "../db/prisma/prisma";

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
  // 삭제하기 전에 favorite 정보를 먼저 가져옴
  const favorite = await prisma.favorite.findUnique({
    where: {
      customerId_moverId: {
        customerId,
        moverId,
      },
    },
  });

  if (!favorite) {
    throw new Error("찜하기 정보를 찾을 수 없습니다.");
  }

  // 삭제 실행
  await prisma.favorite.delete({
    where: {
      customerId_moverId: {
        customerId,
        moverId,
      },
    },
  });

  // 삭제된 favorite 정보 반환
  return favorite;
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

// 찜한 기사님 목록 조회 (페이지네이션)
const getFavoriteMovers = async (customerId: string, limit: number = 3, cursor?: string) => {
  const where = {
    customerId,
    deletedAt: null,
  };

  const take = limit + 1; // 다음 페이지 존재 여부 확인용

  const favorites = await prisma.favorite.findMany({
    where,
    take,
    ...(cursor && {
      cursor: {
        id: cursor,
      },
      skip: 1, // cursor 다음부터 조회
    }),
    orderBy: {
      createdAt: "desc",
    },
    include: {
      mover: {
        select: {
          id: true,
          name: true,
          nickname: true,
          moverImage: true,
          shortIntro: true,
          detailIntro: true,
          career: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          totalFavoriteCount: true,
          currentAreas: true,
          serviceTypes: true,
          isVeteran: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  let hasNext = false;

  if (favorites.length > limit) {
    const nextItem = favorites.pop(); // 마지막 항목 제거
    nextCursor = nextItem?.id;
    hasNext = true;
  }

  return {
    items: favorites.map((favorite) => ({
      id: favorite.mover.id,
      name: favorite.mover.name,
      userType: ["MOVER"], // 기사님 타입
      moverImage: favorite.mover.moverImage,
      nickname: favorite.mover.nickname,
      isVeteran: favorite.mover.isVeteran,
      shortIntro: favorite.mover.shortIntro,
      detailIntro: favorite.mover.detailIntro,
      career: favorite.mover.career,
      workedCount: favorite.mover.workedCount,
      averageRating: favorite.mover.averageRating,
      totalReviewCount: favorite.mover.totalReviewCount,
      totalFavoriteCount: favorite.mover.totalFavoriteCount,
      serviceAreas: [], // 빈 배열로 설정 (필요시 별도 조회)
      serviceTypes: favorite.mover.serviceTypes.map((type) => ({
        service: {
          name:
            type === "SMALL" ? "소형이사" : type === "HOME" ? "가정이사" : type === "OFFICE" ? "사무실이사" : "기타",
        },
      })),
      // 추가 속성들
      description: favorite.mover.detailIntro,
      introduction: favorite.mover.shortIntro,
      completedCount: favorite.mover.workedCount,
      favoriteCount: favorite.mover.totalFavoriteCount,
      experience: favorite.mover.career,
      reviewCount: favorite.mover.totalReviewCount,
      avgRating: favorite.mover.averageRating,
      isFavorited: true, // 찜한 목록이므로 항상 true
      profileImage: favorite.mover.moverImage,
    })),
    nextCursor,
    hasNext,
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
  getFavoriteMovers,
  getMoverFavoriteCount,
  getFavoriteDetailForAction,
};

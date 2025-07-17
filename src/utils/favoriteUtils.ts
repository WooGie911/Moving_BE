import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * 기사님 목록에 찜하기 상태를 추가하는 유틸리티 함수
 * @param movers 기사님 목록 (userId 필드 필요)
 * @param userId 현재 로그인한 사용자 ID (선택적)
 * @returns isFavorited 필드가 추가된 기사님 목록
 */
export const addFavoriteStatusToMovers = async (
  movers: any[],
  userId?: number
): Promise<any[]> => {
  if (!userId) {
    return movers.map(mover => ({ ...mover, isFavorited: false }));
  }
  const moverIds = movers.map(mover => mover.userId);
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      moverId: { in: moverIds }
    },
    select: { moverId: true }
  });
  const favoritedMoverIds = new Set(favorites.map(fav => fav.moverId));
  return movers.map(mover => ({
    ...mover,
    isFavorited: favoritedMoverIds.has(mover.userId)
  }));
};

/**
 * 단일 기사님에 찜하기 상태를 추가하는 유틸리티 함수
 * @param mover 기사님 정보 (userId 필드 필요)
 * @param userId 현재 로그인한 사용자 ID (선택적)
 * @returns isFavorited 필드가 추가된 기사님 정보
 */
export const addFavoriteStatusToMover = async (
  mover: any,
  userId?: number
): Promise<any> => {
  if (!userId) {
    return { ...mover, isFavorited: false };
  }
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_moverId: {
        userId,
        moverId: mover.userId
      }
    }
  });
  return {
    ...mover,
    isFavorited: !!favorite
  };
}; 
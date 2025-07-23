import favoriteRepository from "../repositories/favorite.repository";
import { IFavoriteResponse } from "../types/favorite.types";

const favoriteService = {
  // 찜하기 추가
  async addFavorite(
    customerId: string,
    moverId: string
  ): Promise<IFavoriteResponse> {
    try {
      // 현재 찜하기 상태 확인
      const currentStatus = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

      if (currentStatus.isFavorited) {
        return {
          success: true,
          message: "이미 찜한 기사님입니다.",
          data: currentStatus,
        };
      }

      // 찜하기 추가
      await favoriteRepository.addFavorite(customerId, moverId);

      // 새로운 상태 조회
      const newStatus = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

      return {
        success: true,
        message: "찜하기가 추가되었습니다.",
        data: newStatus,
      };
    } catch (error: unknown) {
      console.error("찜하기 추가 서비스 오류:", error);
      return {
        success: false,
        message: "찜하기 추가 중 오류가 발생했습니다.",
        data: { isFavorited: false, favoriteCount: 0 },
      };
    }
  },

  // 찜하기 제거
  async removeFavorite(
    customerId: string,
    moverId: string
  ): Promise<IFavoriteResponse> {
    try {
      // 현재 찜하기 상태 확인
      const currentStatus = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

      if (!currentStatus.isFavorited) {
        return {
          success: true,
          message: "찜하지 않은 기사님입니다.",
          data: currentStatus,
        };
      }

      // 찜하기 제거
      await favoriteRepository.removeFavorite(customerId, moverId);

      // 새로운 상태 조회
      const newStatus = await favoriteRepository.getFavoriteStatus(
        customerId,
        moverId
      );

      return {
        success: true,
        message: "찜하기가 제거되었습니다.",
        data: newStatus,
      };
    } catch (error: unknown) {
      console.error("찜하기 제거 서비스 오류:", error);
      return {
        success: false,
        message: "찜하기 제거 중 오류가 발생했습니다.",
        data: { isFavorited: false, favoriteCount: 0 },
      };
    }
  },
};

export default favoriteService;
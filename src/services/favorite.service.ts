import favoriteRepository from "../repositories/favorite.repository";
import actionService from "./action.service";
import { ActionType } from "@prisma/client";
import { IFavoriteResponse } from "../types/favorite.types";
import * as Sentry from "@sentry/node";

const favoriteService = {
  // 찜하기 추가
  async addFavorite(customerId: string, moverId: string): Promise<IFavoriteResponse> {
    try {
      // 현재 찜하기 상태 확인
      const currentStatus = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      if (currentStatus.isFavorited) {
        return {
          success: true,
          message: "이미 찜한 기사님입니다.",
          data: currentStatus,
        };
      }

      // 찜하기 추가
      const favorite = await favoriteRepository.addFavorite(customerId, moverId);

      // FAVORITE_ADDED 액션 생성 (실패해도 찜하기는 성공)
      try {
        const favoriteDetail = await favoriteRepository.getFavoriteDetailForAction(favorite.id);
        if (favoriteDetail) {
          await actionService.createAction(customerId, ActionType.FAVORITE_ADDED, favorite.id, "FAVORITE", {
            moverId: moverId,
          });
        }
      } catch (actionError) {
        Sentry.captureException(actionError as Error, {
          extra: { customerId, moverId },
          tags: { error_type: "favorite_error", operation: "favorite_added_action" },
        });
        // 액션 생성 실패는 무시하고 찜하기는 성공으로 처리
      }

      // 새로운 상태 조회
      const newStatus = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      return {
        success: true,
        message: "찜하기가 추가되었습니다.",
        data: newStatus,
      };
    } catch (error: unknown) {
      Sentry.captureException(error as Error, {
        extra: { customerId, moverId },
        tags: { error_type: "favorite_error", operation: "add_favorite" },
      });
      return {
        success: false,
        message: "찜하기 추가 중 오류가 발생했습니다.",
        data: { isFavorited: false, favoriteCount: 0 },
      };
    }
  },

  // 찜하기 제거
  async removeFavorite(customerId: string, moverId: string): Promise<IFavoriteResponse> {
    try {
      // 현재 찜하기 상태 확인
      const currentStatus = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      if (!currentStatus.isFavorited) {
        return {
          success: true,
          message: "찜하지 않은 기사님입니다.",
          data: currentStatus,
        };
      }

      // 찜하기 제거
      const favorite = await favoriteRepository.removeFavorite(customerId, moverId);

      // FAVORITE_REMOVED 액션 생성 (실패해도 찜하기 제거는 성공)
      try {
        const favoriteDetail = await favoriteRepository.getFavoriteDetailForAction(favorite.id);
        if (favoriteDetail) {
          await actionService.createAction(customerId, ActionType.FAVORITE_REMOVED, favorite.id, "FAVORITE", {
            moverId: moverId,
          });
        }
      } catch (actionError) {
        Sentry.captureException(actionError as Error, {
          extra: { customerId, moverId },
          tags: { error_type: "favorite_error", operation: "favorite_removed_action" },
        });
        // 액션 생성 실패는 무시하고 찜하기 제거는 성공으로 처리
      }

      // 새로운 상태 조회
      const newStatus = await favoriteRepository.getFavoriteStatus(customerId, moverId);

      return {
        success: true,
        message: "찜하기가 제거되었습니다.",
        data: newStatus,
      };
    } catch (error: unknown) {
      Sentry.captureException(error as Error, {
        extra: { customerId, moverId },
        tags: { error_type: "favorite_error", operation: "remove_favorite" },
      });
      return {
        success: false,
        message: "찜하기 제거 중 오류가 발생했습니다.",
        data: { isFavorited: false, favoriteCount: 0 },
      };
    }
  },
};

export default favoriteService;

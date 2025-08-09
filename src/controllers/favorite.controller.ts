import { Request, Response } from "express";
import favoriteService from "../services/favorite.service";
import favoriteRepository from "../repositories/favorite.repository";
import { IFavoriteRequest } from "../types/favorite.types";
import * as Sentry from "@sentry/node";

// 커스텀 Request 타입 정의
interface IUserRequest extends Request {
  user?: {
    userId: string;
    name: string;
    userType: "CUSTOMER" | "MOVER";
    hasProfile: boolean;
    iat: number;
    exp: number;
  };
}

class FavoriteController {
  // 찜하기 추가
  async addFavorite(req: IUserRequest, res: Response) {
    try {
      const customerId = req.user?.userId;
      const { moverId }: IFavoriteRequest = req.body;

      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 기사님 ID입니다.",
        });
      }

      // 사용자 역할 검증 (일반 유저만 찜하기 가능)
      const userType = req.user?.userType;
      if (userType !== "CUSTOMER") {
        return res.status(403).json({
          success: false,
          message: "일반 유저만 찜하기를 사용할 수 있습니다.",
        });
      }

      // 자기 자신을 찜할 수 없음
      if (customerId === moverId) {
        return res.status(400).json({
          success: false,
          message: "자기 자신은 찜할 수 없습니다.",
        });
      }

      const result = await favoriteService.addFavorite(customerId!, moverId);

      // 생성 성공 시 201, 그 외(이미 존재 등) 200
      const statusCode = result.success ? 201 : 200;
      return res.status(statusCode).json(result);
    } catch (error) {
      // 센트리로 에러 전송
      Sentry.captureException(error, {
        extra: {
          userId: req.user?.userId,
          userType: req.user?.userType,
          body: req.body,
          url: req.url,
          method: req.method,
        },
        tags: {
          error_type: "favorite_add",
          user_type: req.user?.userType || "unknown",
        },
      });

      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  // 찜하기 제거
  async removeFavorite(req: IUserRequest, res: Response) {
    try {
      const customerId = req.user?.userId;
      const moverId = req.params.moverId;

      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 기사님 ID입니다.",
        });
      }

      // 사용자 역할 검증 (일반 유저만 찜하기 가능)
      const userType = req.user?.userType;
      if (userType !== "CUSTOMER") {
        return res.status(403).json({
          success: false,
          message: "일반 유저만 찜하기를 사용할 수 있습니다.",
        });
      }

      // 자기 자신을 찜할 수 없음
      if (customerId === moverId) {
        return res.status(400).json({
          success: false,
          message: "자기 자신은 찜할 수 없습니다.",
        });
      }

      const result = await favoriteService.removeFavorite(customerId!, moverId);

      // success가 false인 경우도 정상적인 상황이므로 200 상태 코드로 반환
      return res.status(200).json(result);
    } catch (error) {
      // 센트리로 에러 전송
      Sentry.captureException(error, {
        extra: {
          userId: req.user?.userId,
          userType: req.user?.userType,
          params: req.params,
          url: req.url,
          method: req.method,
        },
        tags: {
          error_type: "favorite_remove",
          user_type: req.user?.userType || "unknown",
        },
      });

      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  // 찜한 기사님 목록 조회 (페이지네이션)
  async getFavoriteMovers(req: IUserRequest, res: Response) {
    try {
      const customerId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 3; // 기본값을 3으로 변경
      const cursor = req.query.cursor as string;

      // 입력 검증
      if (limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          message: "limit은 1-50 사이의 값이어야 합니다.",
        });
      }

      // 사용자 역할 검증 (일반 유저만 찜하기 가능)
      const userType = req.user?.userType;
      if (userType !== "CUSTOMER") {
        return res.status(403).json({
          success: false,
          message: "일반 유저만 찜하기를 사용할 수 있습니다.",
        });
      }

      const result = await favoriteRepository.getFavoriteMovers(customerId!, limit, cursor);

      return res.status(200).json({
        success: true,
        message: "찜한 기사님 목록을 성공적으로 조회했습니다.",
        data: result,
      });
    } catch (error) {
      // 센트리로 에러 전송
      Sentry.captureException(error, {
        extra: {
          userId: req.user?.userId,
          userType: req.user?.userType,
          query: req.query,
          url: req.url,
          method: req.method,
        },
        tags: {
          error_type: "favorite_get_movers",
          user_type: req.user?.userType || "unknown",
        },
      });

      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  // 찜하기 상태 확인
  async getFavoriteStatus(req: IUserRequest, res: Response) {
    try {
      const customerId = req.user?.userId;
      const moverId = req.params.moverId;

      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 기사님 ID입니다.",
        });
      }

      // 사용자 역할 검증 (일반 유저만 찜하기 가능)
      const userType = req.user?.userType;
      if (userType !== "CUSTOMER") {
        return res.status(403).json({
          success: false,
          message: "일반 유저만 찜하기를 사용할 수 있습니다.",
        });
      }

      const status = await favoriteRepository.getFavoriteStatus(customerId!, moverId);

      return res.status(200).json({
        success: true,
        message: "찜하기 상태를 성공적으로 조회했습니다.",
        data: status,
      });
    } catch (error) {
      // 센트리로 에러 전송
      Sentry.captureException(error, {
        extra: {
          userId: req.user?.userId,
          userType: req.user?.userType,
          params: req.params,
          url: req.url,
          method: req.method,
        },
        tags: {
          error_type: "favorite_get_status",
          user_type: req.user?.userType || "unknown",
        },
      });

      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }
}

export default new FavoriteController();

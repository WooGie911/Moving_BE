import { Request, Response } from "express";
import favoriteService from "../services/favorite.service";
import { IFavoriteRequest } from "../types/favorite.types";

// 커스텀 Request 타입 정의
interface IUserRequest extends Request {
  user?: {
    userId: number;
    name: string;
    role: string;
  };
}

class FavoriteController {
  // 찜하기 추가
  async addFavorite(req: IUserRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { moverId }: IFavoriteRequest = req.body;

      // 입력 검증
      if (typeof moverId !== "number" || !Number.isInteger(moverId)) {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 기사님 ID입니다.",
        });
      }

      // 사용자 역할 검증 (일반 유저만 찜하기 가능)
      const userRole = req.user?.role;
      if (userRole !== "CUSTOMER") {
        return res.status(403).json({
          success: false,
          message: "일반 유저만 찜하기를 사용할 수 있습니다.",
        });
      }

      // 자기 자신을 찜할 수 없음
      if (userId === moverId) {
        return res.status(400).json({
          success: false,
          message: "자기 자신은 찜할 수 없습니다.",
        });
      }

      const result = await favoriteService.addFavorite(userId!, moverId);

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("찜하기 추가 컨트롤러 오류:", error);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  // 찜하기 제거
  async removeFavorite(req: IUserRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const moverId = Number(req.params.moverId);

      // 입력 검증
      if (!Number.isInteger(moverId)) {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 기사님 ID입니다.",
        });
      }

      // 사용자 역할 검증 (일반 유저만 찜하기 가능)
      const userRole = req.user?.role;
      if (userRole !== "CUSTOMER") {
        return res.status(403).json({
          success: false,
          message: "일반 유저만 찜하기를 사용할 수 있습니다.",
        });
      }

      // 자기 자신을 찜할 수 없음
      if (userId === moverId) {
        return res.status(400).json({
          success: false,
          message: "자기 자신은 찜할 수 없습니다.",
        });
      }

      const result = await favoriteService.removeFavorite(userId!, moverId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("찜하기 제거 컨트롤러 오류:", error);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }
}

export default new FavoriteController(); 
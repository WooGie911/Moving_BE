import { Request, Response } from "express";
import { MovingType } from "@prisma/client";
import QuoteService from "../services/quote.service";
import { ICreateQuoteRequest, IUpdateQuoteRequest } from "../types/quote.types";

const quoteService = new QuoteService();

class QuoteController {
  async createQuote(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "인증이 필요합니다.",
        });
      }

      const quoteData: ICreateQuoteRequest = req.body;

      // 프론트엔드 데이터 필수 필드 검증
      if (!quoteData.movingType || !quoteData.departure || !quoteData.arrival || !quoteData.movingDate) {
        return res.status(400).json({
          success: false,
          message: "필수 필드가 누락되었습니다. (movingType, departure, arrival, movingDate)",
        });
      }

      // 주소 객체의 필수 필드 검증
      if (!quoteData.departure.roadAddress || !quoteData.arrival.roadAddress) {
        return res.status(400).json({
          success: false,
          message: "출발지와 도착지의 주소 정보가 필요합니다.",
        });
      }

      // MovingType enum 값 검증 (소문자도 허용)
      const validMovingTypes = ["SMALL", "HOME", "OFFICE", "small", "home", "office"];
      if (!validMovingTypes.includes(quoteData.movingType)) {
        return res.status(400).json({
          success: false,
          message: `잘못된 이사 타입입니다. 허용된 값: SMALL, HOME, OFFICE (대소문자 구분 없음)`,
        });
      }

      const result = await quoteService.createQuote(quoteData, userId);

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("견적 요청 생성 컨트롤러 오류:", error);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  async getActiveQuote(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "인증이 필요합니다.",
        });
      }

      const result = await quoteService.getActiveQuote(userId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error("활성 견적 요청 조회 컨트롤러 오류:", error);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  async updateQuote(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const quoteId = Number(req.params.quoteId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "인증이 필요합니다.",
        });
      }

      if (!quoteId || isNaN(quoteId)) {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 견적 요청 ID입니다.",
        });
      }

      const updateData: IUpdateQuoteRequest = req.body;

      // 수정할 데이터가 있는지 확인
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "수정할 데이터가 없습니다.",
        });
      }

      // MovingType이 포함된 경우 검증
      if (updateData.movingType) {
        const validMovingTypes = ["SMALL", "HOME", "OFFICE", "small", "home", "office"];
        if (!validMovingTypes.includes(updateData.movingType)) {
          return res.status(400).json({
            success: false,
            message: `잘못된 이사 타입입니다. 허용된 값: SMALL, HOME, OFFICE (대소문자 구분 없음)`,
          });
        }
      }

      // 주소 정보가 포함된 경우 검증
      if (updateData.departure && !updateData.departure.roadAddress) {
        return res.status(400).json({
          success: false,
          message: "출발지 주소 정보가 필요합니다.",
        });
      }

      if (updateData.arrival && !updateData.arrival.roadAddress) {
        return res.status(400).json({
          success: false,
          message: "도착지 주소 정보가 필요합니다.",
        });
      }

      const result = await quoteService.updateQuote(quoteId, updateData, userId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("견적 요청 수정 컨트롤러 오류:", error);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  async cancelActiveQuote(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "인증이 필요합니다.",
        });
      }

      const result = await quoteService.cancelActiveQuote(userId);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("견적 요청 취소 컨트롤러 오류:", error);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }
}

export default QuoteController;

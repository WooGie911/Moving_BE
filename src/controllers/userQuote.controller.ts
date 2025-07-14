import userQuoteService from "../services/userQuote.service";
import { Request, Response, NextFunction } from "express";
import { handleError } from "../utils/handleError";
import { AuthenticationError } from "../types/commonError";

const getPendingQuote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id; //나중에 수정예정
  if (!userId) {
    throw new AuthenticationError("유효하지 않은 유저아이디입니다.");
  }
  try {
    const pendingQuote = await userQuoteService.getPendingQuote(userId);

    res.status(200).json({
      status: 200,
      message: "진행중인 이사 견적 조회 성공",
      data: pendingQuote,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

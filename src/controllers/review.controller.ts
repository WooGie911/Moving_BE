import { NextFunction, Request, Response } from "express";
import reviewService from "../services/review.service";

const reviewController = {
  // 1. 리뷰 작성 (PATCH)
  postReview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reviewId = Number(req.params.id);
      const { rating, content } = req.body;
      if (!reviewId || rating == null || content == null) {
        res.status(400).json({ message: "reviewId, rating, content required" });
      }
      const review = await reviewService.postReview(reviewId, rating, content);
      res.json(review);
    } catch (error) {
      next(error);
    }
  },

  // 2. 리뷰 작성 가능한 Quote 리스트 조회
  getWritableQuotes: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = Number(req.user?.userId || req.query.userId);
      if (!userId) {
        res.status(400).json({ message: "유저를 찾을수 없습니다." });
        return;
      }
      const quotes = await reviewService.getWritableQuotes(userId);
      res.json(quotes);
    } catch (error) {
      next(error);
    }
  },
};

export default reviewController;

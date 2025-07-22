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
      const reviewId = Number(req.params.reviewId);
      const { rating, content } = req.body;
      if (!reviewId || rating == null || content == null) {
        res.status(400).json({ message: "reviewId, rating, content required" });
      }
      const review = await reviewService.postReview(reviewId, rating, content);
      res.json(review);
      res.json({
        success: true,
        message: "리뷰가 작성되었습니다.",
        data: review,
      });
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
      const customerId = Number(req.user?.userId);
      if (!customerId) {
        res.status(400).json({ message: "유저를 찾을수 없습니다." });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 4;
      const quotes = await reviewService.getWritableQuotes(customerId, {
        page,
        pageSize,
      });
      res.json({
        success: true,
        message: "리뷰 작성 가능한 견적 리스트입니다.",
        data: quotes,
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. 내가 쓴 리뷰 목록 조회
  getWrittenReviews: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const customerId = Number(req.params.customerId);
      if (!customerId) {
        res.status(400).json({ message: "유저를 찾을수 없습니다." });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 4;
      const reviews = await reviewService.getWrittenReviews(customerId, {
        page,
        pageSize,
      });
      res.json({
        success: true,
        message: "내가 쓴 리뷰 목록입니다.",
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },
  // 4. 내가 받은 리뷰 목록 조회
  getReceivedReviews: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moverId = Number(req.params.moverId);
      if (!moverId) {
        res.status(400).json({ message: "유저를 찾을수 없습니다." });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 5;
      const reviews = await reviewService.getReceivedReviews(moverId, {
        page,
        pageSize,
      });
      res.json({
        success: true,
        message: "내가 받은 리뷰 목록입니다.",
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default reviewController;

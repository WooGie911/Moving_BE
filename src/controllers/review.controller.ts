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
      const reviewId = req.params.reviewId;
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

  // 2. 리뷰 작성 가능한 estimateRequests 리스트 조회
  getWritableEstimateRequests: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(400).json({ message: "유저를 찾을수 없습니다." });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 4;
      const estimateRequests = await reviewService.getWritableEstimateRequests(
        customerId,
        { page, pageSize }
      );
      res.json({
        success: true,
        message: "리뷰 작성 가능한 견적 요청 리스트입니다.",
        data: estimateRequests,
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
      const customerId = req.params.customerId;
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
      const moverId = req.params.moverId;
      if (!moverId) {
        res.status(400).json({ message: "기사님 ID가 필요합니다." });
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
        message: "기사님 리뷰 목록입니다.",
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default reviewController;

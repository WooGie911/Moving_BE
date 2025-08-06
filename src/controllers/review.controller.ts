import { NextFunction, Request, Response } from "express";
import reviewService from "../services/review.service";
import { captureReviewError } from "../utils/sentryUtils";

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
        res.status(400).json({
          success: false,
          message: "reviewId, rating, content required",
        });
        return;
      }
      const review = await reviewService.postReview(reviewId, rating, content);
      res.json({
        success: true,
        message: "리뷰가 작성되었습니다.",
        data: review,
      });
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "post_review",
        userId: req.user?.userId,
        reviewId: req.params.reviewId,
        requestBody: req.body,
        url: req.url,
        method: req.method,
      });
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
        res.status(400).json({
          success: false,
          message: "유저를 찾을 수 없습니다.",
        });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 4;
      const result = await reviewService.getWritableEstimateRequests(
        customerId,
        { page, pageSize }
      );
      res.json(result);
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "get_writable_estimate_requests",
        userId: req.user?.userId,
        customerId: req.user?.userId,
        requestBody: req.body,
        url: req.url,
        method: req.method,
      });
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
        res.status(400).json({
          success: false,
          message: "유저를 찾을 수 없습니다.",
        });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 4;
      const result = await reviewService.getWrittenReviews(customerId, {
        page,
        pageSize,
      });
      res.json(result);
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "get_written_reviews",
        userId: req.user?.userId,
        customerId: req.params.customerId,
        requestBody: req.body,
        url: req.url,
        method: req.method,
      });
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
        res.status(400).json({
          success: false,
          message: "기사님 ID가 필요합니다.",
        });
        return;
      }
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 5;

      const result = await reviewService.getReceivedReviews(moverId, {
        page,
        pageSize,
      });

      res.json(result);
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "get_received_reviews",
        userId: req.user?.userId,
        moverId: req.params.moverId,
        requestBody: req.body,
        url: req.url,
        method: req.method,
      });
      next(error);
    }
  },
};

export default reviewController;

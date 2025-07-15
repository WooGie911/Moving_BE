import { Router } from "express";
import reviewController from "../controllers/review.controller";

const reviewRouter = Router();

// 리뷰 작성 (완료 처리)
reviewRouter.patch("/:id", reviewController.postReview);

// 리뷰 작성 가능한 Quote 리스트
reviewRouter.get("/writable-quotes", reviewController.getWritableQuotes);

// 내가 쓴 리뷰 목록
reviewRouter.get("/written", reviewController.getWrittenReviews);

export default reviewRouter;

import { Router } from "express";
import reviewController from "../controllers/review.controller";

const reviewRouter = Router();

// 리뷰 작성 (완료 처리)
reviewRouter.patch("/:id", reviewController.postReview);

export default reviewRouter;

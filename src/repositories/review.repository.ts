import prisma from "../db/prisma/prisma";
import { ReviewStatus } from "@prisma/client";

const reviewRepository = {
  // 1. 리뷰 작성 (PATCH)
  postReview: async (reviewId: number, rating: number, content: string) => {
    return prisma.review.update({
      where: { id: reviewId },
      data: { rating, content, status: ReviewStatus.COMPLETED },
    });
  },
};

export default reviewRepository;

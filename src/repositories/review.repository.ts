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

  // 2. 리뷰 작성 가능한 Quote 리스트 조회
  getWritableQuotes: async (userId: number) => {
    return prisma.quote.findMany({
      where: {
        userId,
        confirmedEstimateId: { not: null },
        reviews: {
          some: { status: ReviewStatus.PENDING },
        },
      },
      include: {
        confirmedEstimate: true,
        reviews: {
          where: { status: ReviewStatus.PENDING },
        },
      },
    });
  },

  // 3. 내가 쓴 리뷰 목록 조회
  getWrittenReviews: async (userId: number) => {
    return prisma.review.findMany({
      where: { userId },
      include: {
        quote: true,
        estimate: true,
      },
    });
  },
};

export default reviewRepository;

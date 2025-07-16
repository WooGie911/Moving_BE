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
  getWritableQuotes: async (userId: number, pageQuery: { page: number; pageSize: number }) => {
    const { page, pageSize } = pageQuery;
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.quote.findMany({
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
        skip,
        take: pageSize,
      }),
      prisma.quote.count({
        where: {
          userId,
          confirmedEstimateId: { not: null },
          reviews: {
            some: { status: ReviewStatus.PENDING },
          },
        },
      }),
    ]);
    return { items, total, page, pageSize };
  },

  // 3. 내가 쓴 리뷰 목록 조회
  getWrittenReviews: async (userId: number, pageQuery: { page: number; pageSize: number }) => {
    const { page, pageSize } = pageQuery;
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          quote: true,
          estimate: true,
        },
        skip,
        take: pageSize,
      }),
      prisma.review.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize };
  },
  // 4. 내가 받은 리뷰 목록 조회
  getReceivedReviews: async (moverId: number, pageQuery: { page: number; pageSize: number }) => {
    const { page, pageSize } = pageQuery;
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: { moverId },
        include: {
          quote: true,
          estimate: true,
        },
        skip,
        take: pageSize,
      }),
      prisma.review.count({ where: { moverId } }),
    ]);
    return { items, total, page, pageSize };
  },
};

export default reviewRepository;

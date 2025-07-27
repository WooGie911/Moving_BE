import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const reviewRepository = {
  // 1. 리뷰 작성 (PATCH)
  postReview: async (reviewId: string, rating: number, content: string) => {
    return prisma.review.update({
      where: { id: reviewId },
      data: { rating, content, status: "COMPLETED" },
    });
  },

  // 2. 리뷰 작성 가능한 견적 요청 리스트 조회
  getWritableEstimateRequests: async (
    customerId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    const { page, pageSize } = pageQuery;
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.estimateRequest.findMany({
        where: {
          customerId,
          status: "COMPLETED",
          review: { is: { status: "PENDING" } },
        },
        include: {
          estimates: {
            where: { status: "ACCEPTED" },
            include: {
              mover: true,
            },
          },
          fromAddress: true,
          toAddress: true,
          review: true,
        },
        skip,
        take: pageSize,
      }),
      prisma.estimateRequest.count({
        where: {
          customerId,
          status: "COMPLETED",
          review: { is: { status: "PENDING" } },
        },
      }),
    ]);
    return { items, total, page, pageSize };
  },

  // 3. 내가 쓴 리뷰 목록 조회
  getWrittenReviews: async (
    customerId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    const { page, pageSize } = pageQuery;
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: { customerId },
        include: {
          request: {
            include: {
              fromAddress: true,
              toAddress: true,
              estimates: true,
            },
          },
          mover: true,
        },
        skip,
        take: pageSize,
      }),
      prisma.review.count({ where: { customerId } }),
    ]);
    return { items, total, page, pageSize };
  },

  // 4. 내가 받은 리뷰 목록 조회
  getReceivedReviews: async (
    moverId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    const { page, pageSize } = pageQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          moverId,
          deletedAt: null,
        },
        select: {
          id: true,
          customerId: true,
          moverId: true,
          estimateRequestId: true,
          rating: true,
          content: true,
          createdAt: true,
          writer: {
            select: {
              id: true,
              nickname: true,
              customerImage: true,
            },
          },
          request: {
            select: {
              id: true,
              moveType: true,
              moveDate: true,
              fromAddress: true,
              toAddress: true,
              estimates: {
                where: { status: "ACCEPTED" },
                select: {
                  id: true,
                  price: true,
                  isDesignated: true,
                },
              },
            },
          },
        },
        skip,
        take: pageSize,
      }),
      prisma.review.count({
        where: {
          moverId,
          deletedAt: null,
        },
      }),
    ]);

    return { items, total, page, pageSize };
  },

  // 5. 기사님 리뷰 통계 조회
  getMoverReviewStats: async (moverId: string) => {
    // 모든 리뷰 조회
    const reviews = await prisma.review.findMany({
      where: {
        moverId,
        deletedAt: null,
      },
      select: {
        rating: true,
      },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviewCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // 평균 평점 계산
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // 평점 분포 계산
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating,
      totalReviewCount: reviews.length,
      ratingDistribution,
    };
  },
};

export default reviewRepository;

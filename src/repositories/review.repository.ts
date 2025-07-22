import prisma from "../db/prisma/prisma";

const reviewRepository = {
  // 1. 리뷰 작성 (PATCH)
  postReview: async (reviewId: string, rating: number, content: string) => {
    return prisma.review.update({
      where: { id: reviewId },
      data: { rating, content },
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
        where: { moverId },
        include: {
          request: {
            include: {
              fromAddress: true,
              toAddress: true,
              estimates: true,
            },
          },
          writer: true,
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

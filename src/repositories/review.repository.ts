import prisma from "../db/prisma/prisma";
import { ReviewStatus } from "@prisma/client";

const reviewRepository = {
  // 1. 리뷰 작성 (PATCH)
  postReview: async (reviewId: string, rating: number, content: string) => {
    return prisma.review.update({
      where: { id: reviewId },
      data: { rating, content, status: ReviewStatus.COMPLETED },
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
          review: { is: { status: ReviewStatus.PENDING } },
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
        where: {
          customerId,
          status: "COMPLETED",
        },
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
      prisma.review.count({
        where: {
          customerId,
          status: "COMPLETED",
        },
      }),
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

  // 리뷰 상세 정보 조회 (액션 메타데이터용)
  getReviewDetailForAction: async (reviewId: string) => {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        customerId: true,
        moverId: true,
        estimateRequestId: true,
        status: true,
        mover: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });
    return review;
  },

  // 리뷰 조회 (스케줄러용)
  getReview: async (estimateRequestId: string) => {
    return prisma.review.findFirst({
      where: {
        estimateRequestId,
      },
      include: {
        mover: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });
  },
};

export default reviewRepository;

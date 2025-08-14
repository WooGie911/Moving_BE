import reviewRepository from "../repositories/review.repository";
import actionService from "./action.service";
import { ActionType, ReviewStatus } from "@prisma/client";
import { formatDateForAPI } from "../utils/dateUtils";
import prisma from "../db/prisma/prisma";
import { captureReviewError } from "../utils/sentryUtils";

const reviewService = {
  postReview: async (reviewId: string, rating: number, content: string) => {
    try {
      const review = await reviewRepository.postReview(reviewId, rating, content);

      // 리뷰 제출 액션 생성
      const reviewDetail = await reviewRepository.getReviewDetailForAction(
        review.id
      );

      if (reviewDetail) {
        await actionService.createAction(
          reviewDetail.customerId,
          ActionType.REVIEW_SUBMITTED,
          review.id,
          "REVIEW",
          { moverId: reviewDetail.moverId }
        );

        // 기사님의 리뷰 통계 업데이트
        await updateMoverReviewStats(reviewDetail.moverId);
      }

      return review;
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "post_review_service",
        reviewId,
      });
      throw error;
    }
  },

  getWritableEstimateRequests: async (
    customerId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    try {
      const { items, total, page, pageSize } =
        await reviewRepository.getWritableEstimateRequests(customerId, pageQuery);

      // 각 견적 요청에 연결된 리뷰의 id를 추가
      const mappedItems = await Promise.all(
        items.map(async (req: any) => {
          const acceptedEstimate = req.estimates?.find(
            (e: any) => e.status === "ACCEPTED"
          );
          const reviewId = req.review?.id ?? null;

          return {
            // 기본 정보
            id: req.id,
            reviewId,

            // 무버 정보
            mover: {
              id: acceptedEstimate?.mover?.id ?? null,
              profileImage: acceptedEstimate?.mover?.moverImage ?? null,
              nickname: acceptedEstimate?.mover?.nickname ?? null,
              shortIntro: acceptedEstimate?.mover?.shortIntro ?? null,
              detailIntro: acceptedEstimate?.mover?.detailIntro ?? null,
            },

            // 이사 정보
            moveType: req.moveType,
            moveDate: formatDateForAPI(req.moveDate),
            description: req.description,

            // 주소 정보
            fromAddress: req.fromAddress
              ? {
                  id: req.fromAddress.id,
                  city: req.fromAddress.city,
                  district: req.fromAddress.district,
                  detail: req.fromAddress.detail,
                  region: req.fromAddress.region,
                  zoneCode: req.fromAddress.zoneCode,
                }
              : null,
            toAddress: req.toAddress
              ? {
                  id: req.toAddress.id,
                  city: req.toAddress.city,
                  district: req.toAddress.district,
                  detail: req.toAddress.detail,
                  region: req.toAddress.region,
                  zoneCode: req.toAddress.zoneCode,
                }
              : null,

            // 견적 정보
            estimate: acceptedEstimate
              ? {
                  id: acceptedEstimate.id,
                  price: acceptedEstimate.price,
                  comment: acceptedEstimate.comment,
                  status: acceptedEstimate.status,
                  isDesignated: acceptedEstimate.isDesignated,
                  validUntil: formatDateForAPI(acceptedEstimate.validUntil),
                  createdAt: formatDateForAPI(acceptedEstimate.createdAt),
                  updatedAt: formatDateForAPI(acceptedEstimate.updatedAt),
                }
              : null,

            // 상태 정보
            status: req.status,
            createdAt: formatDateForAPI(req.createdAt),
            updatedAt: formatDateForAPI(req.updatedAt),
          };
        })
      );

      return {
        success: true,
        message: "리뷰 작성 가능한 견적 요청 리스트입니다.",
        data: {
          items: mappedItems,
          total,
          page,
          pageSize,
          hasNextPage: page * pageSize < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "get_writable_estimate_requests_service",
        customerId,
      });
      throw error;
    }
  },

  getWrittenReviews: async (
    customerId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    try {
      const { items, total, page, pageSize } =
        await reviewRepository.getWrittenReviews(customerId, pageQuery);

      const mappedItems = items.map((review: any) => {
        const acceptedEstimate = review.request?.estimates?.find(
          (e: any) => e.status === "ACCEPTED"
        );

        return {
          // 리뷰 정보
          id: review.id,
          rating: review.rating,
          content: review.content,
          status: review.status,
          createdAt: formatDateForAPI(review.createdAt),
          updatedAt: formatDateForAPI(review.updatedAt),

          // 무버 정보
          mover: {
            id: review.moverId,
            profileImage: review.mover?.moverImage ?? null,
            nickname: review.mover?.nickname ?? null,
            shortIntro: review.mover?.shortIntro ?? null,
            detailIntro: review.mover?.detailIntro ?? null,
          },

          // 이사 정보
          moveType: review.request?.moveType ?? null,
          moveDate: formatDateForAPI(review.request?.moveDate) ?? null,
          description: review.request?.description,

          // 주소 정보
          fromAddress: review.request?.fromAddress
            ? {
                id: review.request.fromAddress.id,
                city: review.request.fromAddress.city,
                district: review.request.fromAddress.district,
                detail: review.request.fromAddress.detail,
                region: review.request.fromAddress.region,
                zoneCode: review.request.fromAddress.zoneCode,
              }
            : null,
          toAddress: review.request?.toAddress
            ? {
                id: review.request.toAddress.id,
                city: review.request.toAddress.city,
                district: review.request.toAddress.district,
                detail: review.request.toAddress.detail,
                region: review.request.toAddress.region,
                zoneCode: review.request.toAddress.zoneCode,
              }
            : null,

          // 견적 정보
          estimate: acceptedEstimate
            ? {
                id: acceptedEstimate.id,
                price: acceptedEstimate.price,
                comment: acceptedEstimate.comment,
                status: acceptedEstimate.status,
                isDesignated: acceptedEstimate.isDesignated,
                validUntil: formatDateForAPI(acceptedEstimate.validUntil),
                createdAt: formatDateForAPI(acceptedEstimate.createdAt),
                updatedAt: formatDateForAPI(acceptedEstimate.updatedAt),
              }
            : null,

          // 견적 요청 정보
          estimateRequest: {
            id: review.request?.id ?? null,
            status: review.request?.status ?? null,
            createdAt: formatDateForAPI(review.request?.createdAt) ?? null,
            updatedAt: formatDateForAPI(review.request?.updatedAt) ?? null,
          },
        };
      });

      return {
        success: true,
        message: "내가 쓴 리뷰 목록입니다.",
        data: {
          items: mappedItems,
          total,
          page,
          pageSize,
          hasNextPage: page * pageSize < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "get_written_reviews_service",
        customerId,
      });
      throw error;
    }
  },

  getReceivedReviews: async (
    moverId: string,
    pageQuery: { page: number; pageSize: number; status?: string }
  ) => {
    try {
      const { items, total, page, pageSize } =
        await reviewRepository.getReceivedReviews(moverId, pageQuery);

      const mappedItems = items.map((review: any) => {
        const acceptedEstimate = review.request?.estimates?.find(
          (e: any) => e.status === "ACCEPTED"
        );

        return {
          // 리뷰 정보
          id: review.id,
          rating: review.rating,
          content: review.content,
          status: review.status,
          createdAt: formatDateForAPI(review.createdAt),
          updatedAt: formatDateForAPI(review.updatedAt),

          // 고객 정보 (리뷰 작성자)
          customer: {
            id: review.customerId,
            profileImage: review.writer?.customerImage ?? null,
            nickname: review.writer?.nickname ?? null,
            shortIntro: review.writer?.shortIntro ?? null,
            detailIntro: review.writer?.detailIntro ?? null,
          },

          // 이사 정보
          moveType: review.request?.moveType ?? null,
          moveDate: formatDateForAPI(review.request?.moveDate) ?? null,
          description: review.request?.description,

          // 주소 정보
          fromAddress: review.request?.fromAddress
            ? {
                id: review.request.fromAddress.id,
                city: review.request.fromAddress.city,
                district: review.request.fromAddress.district,
                detail: review.request.fromAddress.detail,
                region: review.request.fromAddress.region,
                zoneCode: review.request.fromAddress.zoneCode,
              }
            : null,
          toAddress: review.request?.toAddress
            ? {
                id: review.request.toAddress.id,
                city: review.request.toAddress.city,
                district: review.request.toAddress.district,
                detail: review.request.toAddress.detail,
                region: review.request.toAddress.region,
                zoneCode: review.request.toAddress.zoneCode,
              }
            : null,

          // 견적 정보
          estimate: acceptedEstimate
            ? {
                id: acceptedEstimate.id,
                price: acceptedEstimate.price,
                comment: acceptedEstimate.comment,
                status: acceptedEstimate.status,
                isDesignated: acceptedEstimate.isDesignated,
                validUntil: formatDateForAPI(acceptedEstimate.validUntil),
                createdAt: formatDateForAPI(acceptedEstimate.createdAt),
                updatedAt: formatDateForAPI(acceptedEstimate.updatedAt),
              }
            : null,

          // 견적 요청 정보
          estimateRequest: {
            id: review.request?.id ?? null,
            status: review.request?.status ?? null,
            createdAt: formatDateForAPI(review.request?.createdAt) ?? null,
            updatedAt: formatDateForAPI(review.request?.updatedAt) ?? null,
          },
        };
      });

      return {
        success: true,
        message: "기사님 리뷰 목록입니다.",
        data: {
          items: mappedItems,
          total,
          page,
          pageSize,
          hasNextPage: page * pageSize < total,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      captureReviewError(error as Error, {
        operation: "get_received_reviews_service",
        moverId,
      });
      throw error;
    }
  },
};

// 기사님의 리뷰 통계 업데이트 함수
export const updateMoverReviewStats = async (moverId: string) => {
  try {
    // 해당 기사님의 모든 리뷰 조회 (삭제되지 않은 것만)
    const reviews = await prisma.review.findMany({
      where: {
        moverId,
        deletedAt: null,
        status: ReviewStatus.COMPLETED,
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // 기사님 정보 업데이트
    await prisma.user.update({
      where: { id: moverId },
      data: {
        totalReviewCount: totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
      },
    });
  } catch (error) {
    captureReviewError(error as Error, {
      operation: "update_mover_review_stats",
      moverId,
    });
    console.error("기사님 리뷰 통계 업데이트 실패:", error);
  }
};

export default reviewService;

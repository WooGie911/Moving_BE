import { Prisma } from "@prisma/client";
import prisma from "../db/prisma/prisma";

// Prisma 미들웨어: EstimateRequest.update에서 확정 견적이 설정될 때 Review 자동 생성
export const reviewPrismaMiddleware: Prisma.Middleware = async (
  params,
  next
) => {
  if (
    params.model === "EstimateRequest" &&
    params.action === "update" &&
    params.args?.data?.status === "COMPLETED"
  ) {
    try {
      // 기존 EstimateRequest를 먼저 조회
      const estimateRequest = await prisma.estimateRequest.findUnique({
        where: params.args.where,
        include: {
          estimates: true,
          review: true,
        },
      });
      if (estimateRequest && !estimateRequest.review) {
        // 확정된 견적 찾기 (status: 'ACCEPTED')
        const acceptedEstimate = estimateRequest.estimates.find(
          (e: any) => e.status === "ACCEPTED"
        );
        if (acceptedEstimate) {
          // 이미 해당 estimateRequestId, customerId로 리뷰가 있는지 확인
          const reviewExists = await prisma.review.findFirst({
            where: {
              estimateRequestId: estimateRequest.id,
              customerId: estimateRequest.customerId,
            },
          });
          if (!reviewExists) {
            await prisma.review.create({
              data: {
                estimateRequestId: estimateRequest.id,
                customerId: estimateRequest.customerId,
                moverId: acceptedEstimate.moverId,
                rating: 0,
                content: "",
              },
            });
          }
        }
      }
    } catch (error) {
      // 에러가 발생해도 미들웨어는 계속 진행
      console.error('Review middleware error:', error);
    }
  }
  return next(params);
};

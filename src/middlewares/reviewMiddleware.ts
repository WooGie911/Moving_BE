import { Prisma } from '@prisma/client';
import prisma from "../db/prisma/prisma";

// Prisma 미들웨어: Quote.update에서 confirmedEstimateId가 새로 설정될 때 Review 자동 생성
export const reviewPrismaMiddleware: Prisma.Middleware = async (params, next) => {
  if (
    params.model === "Quote" &&
    params.action === "update" &&
    params.args?.data?.confirmedEstimateId !== undefined
  ) {
    // 기존 Quote를 먼저 조회
    const quote = await prisma.quote.findUnique({
      where: params.args.where,
      select: { confirmedEstimateId: true, id: true, userId: true },
    });
    const afterId = params.args.data.confirmedEstimateId;
    if (quote && !quote.confirmedEstimateId && afterId) {
      // 이미 해당 quoteId, userId로 리뷰가 있는지 확인
      const reviewExists = await prisma.review.findFirst({
        where: {
          quoteId: quote.id,
          userId: quote.userId,
        },
      });
      if (!reviewExists) {
        // estimateId, moverId를 찾아야 할 수 있음
        const estimate = await prisma.estimate.findUnique({
          where: { id: afterId },
          select: { id: true, moverId: true },
        });
        if (estimate) {
          await prisma.review.create({
            data: {
              quoteId: quote.id,
              estimateId: estimate.id,
              userId: quote.userId,
              moverId: estimate.moverId,
              rating: 0,
              content: "",
            },
          });
        }
      }
    }
  }
  return next(params);
};

import {
  getMoverList,
  getFavoriteMovers,
  createDesignatedEstimateRequest,
} from "../repositories/mover.repository";
import { IMoverListFilter } from "../types/mover.types";
import prisma from "../db/prisma/prisma";

/**
 * 기사님 리스트 조회 (필터, 정렬, 키워드)
 */
export const fetchMoverList = async (filter: IMoverListFilter) => {
  const movers = await getMoverList(filter);
  return movers;
};

/**
 * 찜한 기사님 조회
 */
export const fetchFavoriteMovers = async (userId: number) => {
  const movers = await getFavoriteMovers(userId);
  return movers;
};


/**
 * 기사님 상세 조회
 */
export const fetchMoverDetail = async (id: number) => {
  return await prisma.profile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      serviceRegions: true,
      serviceTypes: { include: { service: true } },
    },
  });
};

/**
 * 지정 견적 요청 
 */
export const requestDesignatedQuote = async ({
  quoteId,
  moverId,
  customerId,
  message,
  expiresAt,
}: {
  quoteId: number;
  moverId: number;
  customerId: number;
  message?: string;
  expiresAt: Date;
}) => {
  // 본인 견적 확인
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.userId !== customerId) {
    throw new Error("본인 견적에만 요청할 수 있습니다.");
  }
  // 중복 체크
  const exists = await prisma.designatedEstimateRequest.findUnique({
    where: { quoteId_moverId: { quoteId, moverId } },
  });
  if (exists) {
    throw new Error("이미 해당 기사님에게 지정 견적을 요청했습니다.");
  }
  // 생성
  return await createDesignatedEstimateRequest({
    quoteId,
    customerId,
    moverId,
    message,
    expiresAt,
  });
};

const moverService = {
  fetchMoverList,
  fetchFavoriteMovers,
  fetchMoverDetail,
  requestDesignatedQuote,
};

export default moverService;

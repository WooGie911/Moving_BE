import reviewRepository from "../repositories/review.repository";

const reviewService = {
  postReview: async (reviewId: string, rating: number, content: string) => {
    return reviewRepository.postReview(reviewId, rating, content);
  },

  getWritableEstimateRequests: async (customerId: string, pageQuery: { page: number; pageSize: number }) => {
    const { items, total, page, pageSize } = await reviewRepository.getWritableEstimateRequests(customerId, pageQuery);
    // FE가 원하는 필드만 추출 (예시)
    const mappedItems = items.map((req: any) => {
      const acceptedEstimate = req.estimates?.find((e: any) => e.status === "ACCEPTED");
      return {
        id: req.id,
        profileImage: acceptedEstimate?.mover?.profile?.profileImage ?? null,
        nickname: acceptedEstimate?.mover?.profile?.nickname ?? null,
        moveType: req.moveType,
        isDesigned: acceptedEstimate?.isDesignated ?? false,
        moverIntroduction: acceptedEstimate?.mover?.profile?.introduction ?? null,
        fromAddress: req.fromAddress,
        toAddress: req.toAddress,
        moveDate: req.moveDate,
        price: acceptedEstimate?.price ?? null,
      };
    });
    return { items: mappedItems, total, page, pageSize };
  },

  getWrittenReviews: async (customerId: string, pageQuery: { page: number; pageSize: number }) => {
    const { items, total, page, pageSize } = await reviewRepository.getWrittenReviews(customerId, pageQuery);
    const mappedItems = items.map((review: any) => {
      return {
        id: review.id,
        moverId: review.moverId,
        profileImage: review.mover?.profile?.profileImage ?? null,
        nickname: review.mover?.profile?.nickname ?? null,
        moverIntroduction: review.mover?.profile?.introduction ?? null,
        moveType: review.estimateRequest?.moveType ?? null,
        isDesigned: review.estimate?.isDesignated ?? false,
        fromAddress: review.estimateRequest?.fromAddress ?? null,
        toAddress: review.estimateRequest?.toAddress ?? null,
        moveDate: review.estimateRequest?.moveDate ?? null,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
      };
    });
    return { items: mappedItems, total, page, pageSize };
  },

  getReceivedReviews: async (moverId: string, pageQuery: { page: number; pageSize: number }) => {
    const { items, total, page, pageSize } = await reviewRepository.getReceivedReviews(moverId, pageQuery);
    const mappedItems = items.map((review: any) => ({
      id: review.id,
      customerId: review.customerId,
      nickname: review.writer?.profile?.nickname ?? null,
      profileImage: review.writer?.profile?.profileImage ?? null,
      moveType: review.estimateRequest?.moveType ?? null,
      fromAddress: review.estimateRequest?.fromAddress ?? null,
      toAddress: review.estimateRequest?.toAddress ?? null,
      moveDate: review.estimateRequest?.moveDate ?? null,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt,
    }));
    return { items: mappedItems, total, page, pageSize };
  },
};

export default reviewService;

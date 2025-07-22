import reviewRepository from "../repositories/review.repository";

const reviewService = {
  postReview: async (reviewId: number, rating: number, content: string) => {
    return reviewRepository.postReview(reviewId, rating, content);
  },

  getWritableQuotes: async (customerId: number, pageQuery: { page: number; pageSize: number }) => {
    const { items, total, page, pageSize } = await reviewRepository.getWritableQuotes(customerId, pageQuery);
    const mappedItems = items.map((quote: any) => ({
      id: quote.id,
      profileImage: quote.confirmedEstimate?.mover?.profile?.profileImage ?? null,
      nickname: quote.confirmedEstimate?.mover?.profile?.nickname ?? null,
      movingType: quote.movingType,
      isDesigned: quote.confirmedEstimate?.isDesignated ?? false,
      moverIntroduction: quote.confirmedEstimate?.mover?.profile?.introduction ?? null,
      departureAddr: quote.departureAddr,
      arrivalAddr: quote.arrivalAddr,
      movingDate: quote.movingDate,
      price: quote.confirmedEstimate?.price ?? null,
    }));
    return { items: mappedItems, total, page, pageSize };
  },

  getWrittenReviews: async (customerId: number, pageQuery: { page: number; pageSize: number }) => {
    const { items, total, page, pageSize } = await reviewRepository.getWrittenReviews(customerId, pageQuery);
    // FE가 원하는 필드만 추출
    const mappedItems = items.map((review: any) => {
      return {
        id: review.id,
        moverId: review.moverId,
        profileImage: review.mover?.profile?.profileImage ?? null,
        nickname: review.mover?.profile?.nickname ?? null,
        moverIntroduction: review.mover?.profile?.introduction ?? null,
        movingType: review.quote?.movingType ?? null,
        isDesigned: review.estimate?.isDesignated ?? false,
        departureAddr: review.quote?.departureAddr ?? null,
        arrivalAddr: review.quote?.arrivalAddr ?? null,
        movingDate: review.quote?.movingDate ?? null,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
      };
    });
    return { items: mappedItems, total, page, pageSize };
  },
  getReceivedReviews: async (moverId: number, pageQuery: { page: number; pageSize: number }) => {
    const { items, total, page, pageSize } = await reviewRepository.getReceivedReviews(moverId, pageQuery);
    const mappedItems = items.map((review: any) => ({
      id: review.id,
      userId: review.userId,
      nickname: review.user?.profile?.nickname ?? null,
      profileImage: review.user?.profile?.profileImage ?? null,
      movingType: review.quote?.movingType ?? null,
      departureAddr: review.quote?.departureAddr ?? null,
      arrivalAddr: review.quote?.arrivalAddr ?? null,
      movingDate: review.quote?.movingDate ?? null,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt,
    }));
    return { items: mappedItems, total, page, pageSize };
  },
};

export default reviewService;

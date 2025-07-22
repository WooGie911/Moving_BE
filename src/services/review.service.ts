import reviewRepository from "../repositories/review.repository";

const reviewService = {
  postReview: async (reviewId: string, rating: number, content: string) => {
    return reviewRepository.postReview(reviewId, rating, content);
  },

  getWritableEstimateRequests: async (
    customerId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    const { items, total, page, pageSize } =
      await reviewRepository.getWritableEstimateRequests(customerId, pageQuery);
    const mappedItems = items.map((req: any) => {
      const acceptedEstimate = req.estimates?.find(
        (e: any) => e.status === "ACCEPTED"
      );
      return {
        id: req.id,
        profileImage: acceptedEstimate?.mover?.profileImage ?? null,
        nickname: acceptedEstimate?.mover?.nickname ?? null,
        moveType: req.moveType,
        isDesigned: acceptedEstimate?.isDesignated ?? false,
        moverIntroduction: acceptedEstimate?.mover?.introduction ?? null,
        fromAddress: req.fromAddress ?? null,
        toAddress: req.toAddress ?? null,
        moveDate: req.moveDate,
        price: acceptedEstimate?.price ?? null,
      };
    });
    return { items: mappedItems, total, page, pageSize };
  },

  getWrittenReviews: async (
    customerId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    const { items, total, page, pageSize } =
      await reviewRepository.getWrittenReviews(customerId, pageQuery);
    const mappedItems = items.map((review: any) => {
      const acceptedEstimate = review.request?.estimates?.find(
        (e: any) => e.status === "ACCEPTED"
      );
      return {
        id: review.id,
        moverId: review.moverId,
        profileImage: review.mover?.profileImage ?? null,
        nickname: review.mover?.nickname ?? null,
        moverIntroduction: review.mover?.introduction ?? null,
        moveType: review.request?.moveType ?? null,
        isDesigned: acceptedEstimate?.isDesignated ?? false,
        fromAddress: review.request?.fromAddress ?? null,
        toAddress: review.request?.toAddress ?? null,
        moveDate: review.request?.moveDate ?? null,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
      };
    });
    return { items: mappedItems, total, page, pageSize };
  },

  getReceivedReviews: async (
    moverId: string,
    pageQuery: { page: number; pageSize: number }
  ) => {
    const { items, total, page, pageSize } =
      await reviewRepository.getReceivedReviews(moverId, pageQuery);
    const mappedItems = items.map((review: any) => {
      const acceptedEstimate = review.request?.estimates?.find(
        (e: any) => e.status === "ACCEPTED"
      );
      return {
        id: review.id,
        estimateRequestId: review.request?.id ?? null,
        customerId: review.customerId,
        moverId: review.moverId,
        profileImage: review.writer?.profileImage ?? null,
        nickname: review.writer?.nickname ?? null,
        moveType: review.request?.moveType ?? null,
        isDesigned: acceptedEstimate?.isDesignated ?? false,
        moverIntroduction: review.writer?.introduction ?? null,
        fromAddress: review.request?.fromAddress ?? null,
        toAddress: review.request?.toAddress ?? null,
        moveDate: review.request?.moveDate ?? null,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
        estimate: acceptedEstimate
          ? {
              id: acceptedEstimate.id,
              price: acceptedEstimate.price,
              comment: acceptedEstimate.comment,
              status: acceptedEstimate.status,
              isDesignated: acceptedEstimate.isDesignated,
              validUntil: acceptedEstimate.validUntil,
              workingHours: acceptedEstimate.workingHours,
              includesPackaging: acceptedEstimate.includesPackaging,
              insuranceAmount: acceptedEstimate.insuranceAmount,
              createdAt: acceptedEstimate.createdAt,
              updatedAt: acceptedEstimate.updatedAt,
            }
          : null,
      };
    });
    return { items: mappedItems, total, page, pageSize };
  },
};

export default reviewService;

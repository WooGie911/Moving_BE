import reviewRepository from "../repositories/review.repository";

const reviewService = {
  postReview: async (reviewId: number, rating: number, content: string) => {
    return reviewRepository.postReview(reviewId, rating, content);
  },

  getWritableQuotes: async (customerId: number, pageQuery: { page: number; pageSize: number }) => {
    return reviewRepository.getWritableQuotes(customerId, pageQuery);
  },

  getWrittenReviews: async (customerId: number, pageQuery: { page: number; pageSize: number }) => {
    return reviewRepository.getWrittenReviews(customerId, pageQuery);
  },
  getReceivedReviews: async (moverId: number, pageQuery: { page: number; pageSize: number }) => {
    return reviewRepository.getReceivedReviews(moverId, pageQuery);
  },
};

export default reviewService;

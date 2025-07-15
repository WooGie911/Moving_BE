import reviewRepository from "../repositories/review.repository";

const reviewService = {
  postReview: async (reviewId: number, rating: number, content: string) => {
    return reviewRepository.postReview(reviewId, rating, content);
  },

  getWritableQuotes: async (userId: number) => {
    return reviewRepository.getWritableQuotes(userId);
  },

  getWrittenReviews: async (userId: number) => {
    return reviewRepository.getWrittenReviews(userId);
  },
};

export default reviewService;

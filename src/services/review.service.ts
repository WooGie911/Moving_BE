import reviewRepository from "../repositories/review.repository";

const reviewService = {
  postReview: async (reviewId: number, rating: number, content: string) => {
    return reviewRepository.postReview(reviewId, rating, content);
  },
};

export default reviewService;

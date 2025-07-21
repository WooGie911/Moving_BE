import { MoveType, RequestStatus, EstimateRequest } from "@prisma/client";
import estimateRequestRepository from "../repositories/estimateRequest.repository";

class EstimateRequestService {
  async hasPendingRequest(userId: string): Promise<boolean> {
    return await estimateRequestRepository.hasPendingRequest(userId);
  }
  async isActiveRequestPending(userId: string): Promise<boolean> {
    return await estimateRequestRepository.isActiveRequestPending(userId);
  }
  async hasEstimateFromMover(userId: string): Promise<boolean> {
    return await estimateRequestRepository.hasEstimateFromMover(userId);
  }
  async getActiveEstimateRequestByUserId(userId: string) {
    return await estimateRequestRepository.getActiveEstimateRequestByUserId(userId);
  }
  // 기타 필요한 estimateRequest 관련 메서드 추가 가능
}
export default EstimateRequestService;

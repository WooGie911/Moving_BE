import estimateRequestRepository from "../repositories/estimateRequest.repository";
import { TCreateEstimateRequest } from "../types/estimateRequest.types";
// Prisma 관련 import 및 선언 제거

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
  async createEstimateRequest(params: TCreateEstimateRequest) {
    const {
      userId,
      moveType,
      fromCity,
      fromDistrict,
      fromDetail,
      fromRegion,
      toCity,
      toDistrict,
      toDetail,
      toRegion,
      moveDate,
      description,
    } = params;
    // 출발지 주소 생성 또는 검색 (레포 함수 사용)
    const fromAddress = await estimateRequestRepository.findOrCreateAddress({
      city: fromCity,
      district: fromDistrict,
      detail: fromDetail,
      region: fromRegion,
    });
    // 도착지 주소 생성 또는 검색 (레포 함수 사용)
    const toAddress = await estimateRequestRepository.findOrCreateAddress({
      city: toCity,
      district: toDistrict,
      detail: toDetail,
      region: toRegion,
    });
    // EstimateRequest 생성
    return await estimateRequestRepository.createEstimateRequest(
      {
        moveType,
        moveDate,
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        description,
      },
      userId,
    );
  }

  async updateActiveEstimateRequest(id: string, updateData: any) {
    // moveDate가 있으면 Date 타입으로 변환
    if (updateData.moveDate) {
      updateData.moveDate = new Date(updateData.moveDate);
    }
    return await estimateRequestRepository.updateEstimateRequest(id, updateData);
  }

  async cancelActiveEstimateRequest(id: string) {
    return await estimateRequestRepository.cancelEstimateRequest(id);
  }

  // findOrCreateAddress 함수는 더 이상 서비스에 필요 없음
  // 기타 필요한 estimateRequest 관련 메서드 추가 가능
}
export default EstimateRequestService;

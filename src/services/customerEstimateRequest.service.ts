import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  TPendingQuoteResponse,
  TReceivedQuoteResponse,
  TQuoteDetailResponse,
  TConfirmEstimateResponse,
  TDesignateEstimateRequest,
} from "../types/customerEstimateRequest";

const customerEstimateRequestService = {
  // 진행중인 견적요청 조회
  getPendingEstimateRequest: async (
    userId: string
  ): Promise<TPendingQuoteResponse> => {
    const activeEstimateRequestId =
      await customerEstimateRequestRepository.getActiveEstimateRequest(userId);
    if (!activeEstimateRequestId) {
      throw new NotFoundError("진행중인 견적요청이 없습니다.");
    }

    const data =
      await customerEstimateRequestRepository.getPendingEstimateRequest(
        activeEstimateRequestId,
        userId
      );
    if (!data) {
      throw new NotFoundError("진행중인 견적요청이 없습니다.");
    }

    return {
      estimateRequest: {
        id: data.id,
        customerId: data.customerId,
        moveType: data.moveType,
        moveDate: data.moveDate,
        createdAt: data.createdAt,
        description: data.description,
        status: data.status,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
      },
      estimates: data.estimates ?? [],
    };
  },

  // 완료된 견적요청 목록 조회
  getReceivedEstimateRequests: async (
    userId: string
  ): Promise<TReceivedQuoteResponse[]> => {
    const result =
      await customerEstimateRequestRepository.getReceivedEstimateRequests(
        userId
      );
    if (!result || result.length === 0) {
      throw new NotFoundError("완료된 견적요청이 없습니다.");
    }
    return result.map((data) => ({
      estimateRequest: {
        id: data.id,
        customerId: data.customerId,
        moveType: data.moveType,
        moveDate: data.moveDate,
        createdAt: data.createdAt,
        description: data.description,
        status: data.status,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
      },
      estimates: data.estimates ?? [],
    }));
  },

  // 진행중인 견적요청의 특정 견적 상세 조회
  getPendingEstimateRequestDetail: async (
    userId: string,
    estimateId: string
  ): Promise<TQuoteDetailResponse> => {
    const activeEstimateRequestId =
      await customerEstimateRequestRepository.getActiveEstimateRequest(userId);
    if (!activeEstimateRequestId) {
      throw new NotFoundError("진행중인 견적요청이 없습니다.");
    }
    const result =
      await customerEstimateRequestRepository.getPendingEstimateRequestDetail(
        activeEstimateRequestId,
        estimateId,
        userId
      );
    if (!result) {
      throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
    }
    // Record<string, any> -> TQuoteDetailResponse 변환
    return {
      id: result.id,
      price: result.price,
      comment: result.comment,
      status: result.status,
      isDesignated: result.isDesignated,
      createdAt: result.createdAt,
      mover: result.mover,
    };
  },

  // 완료된 견적요청의 특정 견적 상세 조회
  getReceivedEstimateRequestDetail: async (
    userId: string,
    estimateRequestId: string,
    estimateId: string
  ): Promise<TQuoteDetailResponse> => {
    const result =
      await customerEstimateRequestRepository.getReceivedEstimateRequestDetail(
        userId,
        estimateRequestId,
        estimateId
      );
    if (!result) {
      throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
    }
    // Record<string, any> -> TQuoteDetailResponse 변환
    return {
      id: result.id,
      price: result.price,
      comment: result.comment,
      status: result.status,
      isDesignated: result.isDesignated,
      createdAt: result.createdAt,
      mover: result.mover,
    };
  },

  // 견적 확정
  confirmEstimate: async (
    userId: string,
    estimateId: string
  ): Promise<TConfirmEstimateResponse> => {
    const result = await customerEstimateRequestRepository.confirmEstimate(
      userId,
      estimateId
    );
    if (!result) {
      throw new NotFoundError("견적 확정에 실패했습니다.");
    }
    return result;
  },

  // 지정 견적 요청
  designateEstimateRequest: async (
    estimateRequestId: string,
    userId: string,
    message: string,
    moverId: string
  ): Promise<TDesignateEstimateRequest> => {
    const result =
      await customerEstimateRequestRepository.designateEstimateRequest(
        estimateRequestId,
        userId,
        message,
        moverId
      );
    if (!result) {
      throw new NotFoundError("지정 견적 요청에 실패했습니다.");
    }
    return result;
  },
};

export default customerEstimateRequestService;

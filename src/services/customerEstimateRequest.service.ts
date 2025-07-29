import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  ServiceError,
  ServiceValidationError,
  ServiceDataProcessingError,
  RepositoryError,
} from "../types/errors.types";
import {
  EstimateRequestWithRelations,
  MultipleEstimateRequestWithRelations,
} from "../types/repository.types";
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
    try {
      // 입력 검증
      if (!userId || typeof userId !== "string") {
        throw new ServiceValidationError("잘못된 사용자 ID입니다");
      }

      const activeEstimateRequestId =
        await customerEstimateRequestRepository.getActiveEstimateRequest(
          userId
        );

      if (!activeEstimateRequestId) {
        // 비즈니스 로직: 활성 견적요청이 없을 때의 처리
        return {
          estimateRequest: null,
          estimates: [],
        };
      }

      const rawData =
        await customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        );

      if (!rawData) {
        // 비즈니스 로직: 데이터가 없을 때의 처리
        return {
          estimateRequest: null,
          estimates: [],
        };
      }

      // 비즈니스 로직: 데이터 변환 및 가공
      const result = {
        estimateRequest: {
          id: rawData.id,
          customerId: rawData.customerId,
          moveType: rawData.moveType,
          moveDate: rawData.moveDate,
          createdAt: rawData.createdAt,
          description: rawData.description,
          status: rawData.status,
          fromAddress: rawData.fromAddress,
          toAddress: rawData.toAddress,
        },
        estimates:
          rawData.estimates?.map((estimate) => ({
            id: estimate.id,
            price: estimate.price ?? 0,
            comment: estimate.comment,
            status: estimate.status,
            isDesignated: estimate.isDesignated,
            createdAt: estimate.createdAt,
            mover: {
              ...estimate.mover,
              // 비즈니스 로직: 찜 여부 계산
              isFavorite:
                estimate.mover.Favorite && estimate.mover.Favorite.length > 0,
              totalFavoriteCount: estimate.mover.totalFavoriteCount,
              Favorite: estimate.mover.Favorite,
            },
          })) ?? [],
      };
      return result;
    } catch (error) {
      if (error instanceof RepositoryError) {
        // Repository 에러를 Service 에러로 래핑
        throw new ServiceError(
          `진행중인 견적요청 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }
      throw error;
    }
  },

  // 비즈니스 로직: 진행중인 견적 데이터 변환
  transformPendingEstimateData: (
    rawData: EstimateRequestWithRelations
  ): TPendingQuoteResponse => {
    try {
      if (!rawData) {
        return {
          estimateRequest: null,
          estimates: [],
        };
      }

      return {
        estimateRequest: {
          id: rawData.id,
          customerId: rawData.customerId,
          moveType: rawData.moveType,
          moveDate: rawData.moveDate,
          createdAt: rawData.createdAt,
          description: rawData.description,
          status: rawData.status,
          fromAddress: rawData.fromAddress,
          toAddress: rawData.toAddress,
        },
        estimates:
          rawData.estimates?.map((estimate) => ({
            id: estimate.id,
            price: estimate.price ?? 0,
            comment: estimate.comment,
            status: estimate.status,
            isDesignated: estimate.isDesignated,
            createdAt: estimate.createdAt,
            mover: {
              ...estimate.mover,
              // 비즈니스 로직: 찜 여부 계산
              isFavorite:
                estimate.mover.Favorite && estimate.mover.Favorite.length > 0,
              totalFavoriteCount: estimate.mover.totalFavoriteCount,
              Favorite: estimate.mover.Favorite,
            },
          })) ?? [],
      };
    } catch (error) {
      throw new ServiceDataProcessingError(
        "진행중인 견적 데이터 변환 실패",
        error
      );
    }
  },

  // 완료된 견적요청 목록 조회
  getReceivedEstimateRequests: async (
    userId: string
  ): Promise<TReceivedQuoteResponse[]> => {
    try {
      // 입력 검증
      if (!userId || typeof userId !== "string") {
        throw new ServiceValidationError("잘못된 사용자 ID입니다");
      }

      const rawResult =
        await customerEstimateRequestRepository.getReceivedEstimateRequests(
          userId
        );

      if (!rawResult || rawResult.length === 0) {
        // 비즈니스 로직: 완료된 견적요청이 없을 때의 처리
        throw new NotFoundError("완료된 견적요청이 없습니다.");
      }

      // 비즈니스 로직: 데이터 변환 및 가공
      const mappedResult =
        customerEstimateRequestService.transformReceivedEstimateData(
          rawResult || []
        );

      return mappedResult;
    } catch (error) {
      if (error instanceof RepositoryError) {
        // Repository 에러를 Service 에러로 래핑
        throw new ServiceError(
          `완료된 견적요청 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }
      throw error;
    }
  },

  // 비즈니스 로직: 완료된 견적 데이터 변환
  transformReceivedEstimateData: (
    rawData: MultipleEstimateRequestWithRelations
  ): TReceivedQuoteResponse[] => {
    try {
      if (!rawData) return [];

      return rawData.map((request) => ({
        estimateRequest: {
          id: request.id,
          customerId: request.customerId,
          moveType: request.moveType,
          moveDate: request.moveDate,
          createdAt: request.createdAt,
          description: request.description,
          status: request.status,
          fromAddress: request.fromAddress,
          toAddress: request.toAddress,
        },
        estimates: request.estimates.map((estimate) => ({
          id: estimate.id,
          price: estimate.price ?? 0,
          comment: estimate.comment,
          status: estimate.status,
          isDesignated: estimate.isDesignated,
          createdAt: estimate.createdAt || new Date(),
          mover: {
            ...estimate.mover,
            // 비즈니스 로직: 찜 여부 계산
            isFavorite:
              estimate.mover.Favorite && estimate.mover.Favorite.length > 0,
            totalFavoriteCount: estimate.mover.totalFavoriteCount,
            Favorite: estimate.mover.Favorite,
          },
        })),
      }));
    } catch (error) {
      throw new ServiceDataProcessingError(
        "완료된 견적 데이터 변환 실패",
        error
      );
    }
  },

  // 진행중인 견적요청의 특정 견적 상세 조회
  getPendingEstimateRequestDetail: async (
    userId: string,
    estimateId: string
  ): Promise<TQuoteDetailResponse | Record<string, never>> => {
    const activeEstimateRequestId =
      await customerEstimateRequestRepository.getActiveEstimateRequest(userId);
    if (!activeEstimateRequestId) {
      // throw new NotFoundError("진행중인 견적요청이 없습니다.");
      return {};
    }
    const result =
      await customerEstimateRequestRepository.getPendingEstimateRequestDetail(
        activeEstimateRequestId,
        estimateId,
        userId
      );
    if (!result) {
      // throw new NotFoundError("견적 상세 정보를 찾을 수 없습니다.");
      return {};
    }
    // Record<string, any> -> TQuoteDetailResponse 변환
    return {
      id: result.id,
      price: result.price,
      comment: result.comment,
      status: result.status,
      isDesignated: result.isDesignated,
      createdAt: result.createdAt,
      mover: {
        ...result.mover,
        isFavorite: result.mover.isFavorite,
        totalFavoriteCount: result.mover.totalFavoriteCount,
        Favorite: result.mover.Favorite,
      },
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
      mover: {
        ...result.mover,
        isFavorite: result.mover.isFavorite,
        totalFavoriteCount: result.mover.totalFavoriteCount,
        Favorite: result.mover.Favorite,
      },
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

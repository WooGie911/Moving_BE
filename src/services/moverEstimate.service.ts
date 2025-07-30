import moverEstimateRepository from "../repositories/moverEstimate.repository";
import { NotFoundError } from "../types/commonError.types";
import {
  MoverEstimateDuplicateError,
  MoverEstimateQuotaExceededError,
  MoverInvalidEstimateRequestError,
  MoverExpiredEstimateRequestError,
  MoverInvalidEstimateStatusError,
  MoverNoDesignatedRequestError,
  MoverUnauthorizedAccessError,
  ServiceError,
  ServiceValidationError,
  RepositoryError,
} from "../types/errors.types";

import {
  TCreateEstimateRequest,
  TRejectEstimateRequest,
  TUpdateEstimateRequest,
  TUpdateEstimateStatusRequest,
  TEstimateRequestResponse,
  TEstimateResponse,
  TMyEstimateResponse,
  TMyRejectedEstimateResponse,
} from "../types/moverEstimate";

const moverEstimateService = {
  // 견적 생성
  createEstimate: async (
    data: TCreateEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      // 입력 검증
      if (!data.moverId || typeof data.moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      if (
        !data.estimateRequestId ||
        typeof data.estimateRequestId !== "string"
      ) {
        throw new ServiceValidationError("잘못된 견적 요청 ID입니다");
      }

      if (!data.price || typeof data.price !== "number" || data.price <= 0) {
        throw new ServiceValidationError("유효하지 않은 가격입니다");
      }

      if (!data.comment || data.comment.trim().length === 0) {
        throw new ServiceValidationError("견적 코멘트를 입력해주세요");
      }

      // 비즈니스 로직: 견적 요청 유효성 검증
      const estimateRequest =
        await moverEstimateRepository.findEstimateRequestById(
          data.estimateRequestId
        );

      if (!estimateRequest) {
        throw new MoverInvalidEstimateRequestError();
      }

      if (estimateRequest.status !== "PENDING") {
        throw new MoverInvalidEstimateRequestError();
      }

      // 비즈니스 로직: 이사일 검증
      if (new Date() > estimateRequest.moveDate) {
        throw new MoverExpiredEstimateRequestError();
      }

      // 비즈니스 로직: 중복 견적 검증
      const existingEstimate =
        await moverEstimateRepository.findExistingEstimate(
          data.estimateRequestId,
          data.moverId
        );

      if (existingEstimate) {
        throw new MoverEstimateDuplicateError();
      }

      // 비즈니스 로직: 지정 견적 여부 확인
      const designatedRequest =
        await moverEstimateRepository.findDesignatedRequest(
          data.estimateRequestId,
          data.moverId
        );

      const isDesignated = !!designatedRequest;

      // 비즈니스 로직: 견적 개수 제한 확인
      const existingEstimates =
        await moverEstimateRepository.countExistingEstimates(
          data.estimateRequestId
        );

      const regularEstimates = existingEstimates.filter((e) => !e.isDesignated);
      const designatedEstimates = existingEstimates.filter(
        (e) => e.isDesignated
      );

      if (!isDesignated && regularEstimates.length >= 5) {
        throw new MoverEstimateQuotaExceededError();
      }

      if (isDesignated && designatedEstimates.length >= 3) {
        throw new MoverEstimateQuotaExceededError();
      }

      // 데이터 생성
      const estimate = await moverEstimateRepository.createEstimate(
        data.estimateRequestId,
        data.moverId,
        data.price,
        data.comment,
        "PROPOSED",
        isDesignated
      );

      if (!estimate) {
        throw new ServiceError("견적 생성에 실패했습니다");
      }

      return estimate;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `견적 생성 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (
        error instanceof ServiceValidationError ||
        error instanceof ServiceError ||
        error instanceof MoverEstimateDuplicateError ||
        error instanceof MoverEstimateQuotaExceededError ||
        error instanceof MoverInvalidEstimateRequestError ||
        error instanceof MoverExpiredEstimateRequestError
      ) {
        throw error;
      }

      throw new ServiceError(
        "견적 생성 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 견적 반려
  rejectEstimate: async (
    data: TRejectEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      // 입력 검증
      if (!data.moverId || typeof data.moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      if (
        !data.estimateRequestId ||
        typeof data.estimateRequestId !== "string"
      ) {
        throw new ServiceValidationError("잘못된 견적 요청 ID입니다");
      }

      if (!data.comment || data.comment.trim().length === 0) {
        throw new ServiceValidationError("반려 사유를 입력해주세요");
      }

      // 비즈니스 로직: 견적 요청 유효성 검증
      const estimateRequest =
        await moverEstimateRepository.findEstimateRequestById(
          data.estimateRequestId
        );

      if (!estimateRequest) {
        throw new MoverInvalidEstimateRequestError();
      }

      if (estimateRequest.status !== "PENDING") {
        throw new MoverInvalidEstimateRequestError();
      }

      // 비즈니스 로직: 이사일 검증
      if (new Date() > estimateRequest.moveDate) {
        throw new MoverExpiredEstimateRequestError();
      }

      // 비즈니스 로직: 중복 견적 검증
      const existingEstimate =
        await moverEstimateRepository.findExistingEstimate(
          data.estimateRequestId,
          data.moverId
        );

      if (existingEstimate) {
        throw new MoverEstimateDuplicateError();
      }

      // 비즈니스 로직: 지정 견적 여부 확인
      const designatedRequest =
        await moverEstimateRepository.findDesignatedRequest(
          data.estimateRequestId,
          data.moverId
        );

      const isDesignated = !!designatedRequest;

      // 데이터 생성
      const estimate = await moverEstimateRepository.createEstimate(
        data.estimateRequestId,
        data.moverId,
        0, // 반려 견적은 가격 0
        data.comment,
        "REJECTED",
        isDesignated
      );

      if (!estimate) {
        throw new ServiceError("견적 반려에 실패했습니다");
      }

      return estimate;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `견적 반려 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (
        error instanceof ServiceValidationError ||
        error instanceof ServiceError ||
        error instanceof MoverEstimateDuplicateError ||
        error instanceof MoverInvalidEstimateRequestError ||
        error instanceof MoverExpiredEstimateRequestError
      ) {
        throw error;
      }

      throw new ServiceError(
        "견적 반려 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 서비스 가능 지역 견적 조회
  getRegionEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ): Promise<TEstimateRequestResponse[]> => {
    try {
      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      // 비즈니스 로직: 사용자 서비스 지역 조회
      const currentAreas =
        await moverEstimateRepository.findUserServiceAreas(moverId);

      // 데이터 조회
      const estimateRequests =
        await moverEstimateRepository.getRegionEstimateRequest(
          moverId,
          sortBy,
          customerName,
          movingType,
          currentAreas
        );

      return estimateRequests || [];
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `서비스 가능 지역 견적 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (error instanceof ServiceValidationError) {
        throw error;
      }

      throw new ServiceError(
        "서비스 가능 지역 견적 조회 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 지정 견적 조회
  getDesignatedEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ): Promise<TEstimateRequestResponse[] | null> => {
    try {
      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      const estimateRequests =
        await moverEstimateRepository.getDesignatedEstimateRequest(
          moverId,
          sortBy,
          customerName,
          movingType
        );

      if (!estimateRequests || estimateRequests.length === 0) {
        throw new MoverNoDesignatedRequestError();
      }

      return estimateRequests;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `지정 견적 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (
        error instanceof ServiceValidationError ||
        error instanceof MoverNoDesignatedRequestError
      ) {
        throw error;
      }

      throw new ServiceError(
        "지정 견적 조회 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 지역/지정 견적 통합 조회
  getAllEstimateRequests: async (
    moverId: string,
    options: {
      region: boolean;
      designated: boolean;
      sortBy?: "moveDate" | "createdAt";
      customerName?: string;
      movingType?: "SMALL" | "HOME" | "OFFICE";
    }
  ): Promise<{
    regionEstimateRequests?: TEstimateRequestResponse[];
    designatedEstimateRequests?: TEstimateRequestResponse[];
  }> => {
    try {
      const { region, designated, sortBy, customerName, movingType } = options;

      let regionEstimateRequests: TEstimateRequestResponse[] = [];
      let designatedEstimateRequests: TEstimateRequestResponse[] = [];

      if (region) {
        try {
          // 비즈니스 로직: 사용자 서비스 지역 조회
          const currentAreas =
            await moverEstimateRepository.findUserServiceAreas(moverId);

          regionEstimateRequests =
            (await moverEstimateRepository.getRegionEstimateRequest(
              moverId,
              sortBy,
              customerName,
              movingType,
              currentAreas
            )) || [];
        } catch (error) {
          regionEstimateRequests = [];
        }
      }

      if (designated) {
        try {
          designatedEstimateRequests =
            (await moverEstimateRepository.getDesignatedEstimateRequest(
              moverId,
              sortBy,
              customerName,
              movingType
            )) || [];
        } catch (error) {
          designatedEstimateRequests = [];
        }
      }

      const result = {
        regionEstimateRequests: region ? regionEstimateRequests : undefined,
        designatedEstimateRequests: designated
          ? designatedEstimateRequests
          : undefined,
      };

      return result;
    } catch (error) {
      throw error;
    }
  },

  // 견적 요청 상세 조회
  getEstimateRequestById: async (
    estimateRequestId: string
  ): Promise<TEstimateRequestResponse | null> => {
    try {
      // 입력 검증
      if (!estimateRequestId || typeof estimateRequestId !== "string") {
        throw new ServiceValidationError("잘못된 견적 요청 ID입니다");
      }

      const estimateRequest =
        await moverEstimateRepository.getEstimateRequestById(estimateRequestId);

      if (!estimateRequest) {
        throw new NotFoundError("견적 요청을 찾을 수 없습니다.");
      }

      return estimateRequest;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `견적 요청 상세 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (
        error instanceof ServiceValidationError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }

      throw new ServiceError(
        "견적 요청 상세 조회 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 내가 보낸 견적서 조회
  getMyEstimate: async (moverId: string): Promise<TMyEstimateResponse[]> => {
    try {
      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      const estimates = await moverEstimateRepository.getMyEstimate(moverId);
      return estimates || [];
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `내가 보낸 견적서 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (error instanceof ServiceValidationError) {
        throw error;
      }

      throw new ServiceError(
        "내가 보낸 견적서 조회 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 내가 반려한 견적 조회
  getMyRejectedEstimates: async (
    moverId: string
  ): Promise<TMyRejectedEstimateResponse[]> => {
    try {
      // 입력 검증
      if (!moverId || typeof moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      const rejectedEstimates =
        await moverEstimateRepository.getMyRejectedEstimates(moverId);
      return rejectedEstimates || [];
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `내가 반려한 견적 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (error instanceof ServiceValidationError) {
        throw error;
      }

      throw new ServiceError(
        "내가 반려한 견적 조회 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 견적 상태 업데이트
  updateEstimateStatus: async (
    data: TUpdateEstimateStatusRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      // 입력 검증
      if (!data.moverId || typeof data.moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      if (!data.estimateId || typeof data.estimateId !== "string") {
        throw new ServiceValidationError("잘못된 견적 ID입니다");
      }

      if (
        !data.status ||
        !["PROPOSED", "ACCEPTED", "REJECTED", "AUTO_REJECTED"].includes(
          data.status
        )
      ) {
        throw new ServiceValidationError("유효하지 않은 견적 상태입니다");
      }

      // 비즈니스 로직: 견적 소유권 확인
      const hasOwnership = await moverEstimateRepository.checkEstimateOwnership(
        data.estimateId,
        data.moverId
      );

      if (!hasOwnership) {
        throw new MoverUnauthorizedAccessError();
      }

      const estimate = await moverEstimateRepository.updateEstimateStatus(
        data.estimateId,
        data.status
      );

      if (!estimate) {
        throw new ServiceError("견적 상태 업데이트에 실패했습니다");
      }

      return estimate;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `견적 상태 업데이트 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (
        error instanceof ServiceValidationError ||
        error instanceof ServiceError ||
        error instanceof MoverUnauthorizedAccessError
      ) {
        throw error;
      }

      throw new ServiceError(
        "견적 상태 업데이트 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },

  // 견적서 업데이트
  updateEstimate: async (
    data: TUpdateEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      // 입력 검증
      if (!data.moverId || typeof data.moverId !== "string") {
        throw new ServiceValidationError("잘못된 기사 ID입니다");
      }

      if (!data.estimateId || typeof data.estimateId !== "string") {
        throw new ServiceValidationError("잘못된 견적 ID입니다");
      }

      if (!data.price || typeof data.price !== "number" || data.price <= 0) {
        throw new ServiceValidationError("유효하지 않은 가격입니다");
      }

      if (!data.comment || data.comment.trim().length === 0) {
        throw new ServiceValidationError("견적 코멘트를 입력해주세요");
      }

      // 비즈니스 로직: 견적 소유권 확인
      const hasOwnership = await moverEstimateRepository.checkEstimateOwnership(
        data.estimateId,
        data.moverId
      );

      if (!hasOwnership) {
        throw new MoverUnauthorizedAccessError();
      }

      // 비즈니스 로직: 견적 상태 확인 (PROPOSED 상태만 수정 가능)
      const existingEstimate =
        await moverEstimateRepository.findExistingEstimate(
          data.estimateId,
          data.moverId
        );

      if (existingEstimate && existingEstimate.status !== "PROPOSED") {
        throw new MoverInvalidEstimateStatusError();
      }

      const estimate = await moverEstimateRepository.updateEstimatePrice(
        data.estimateId,
        data.price,
        data.comment
      );

      if (!estimate) {
        throw new ServiceError("견적서 업데이트에 실패했습니다");
      }

      return estimate;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(
          `견적서 업데이트 실패: ${error.message}`,
          undefined,
          error
        );
      }

      if (
        error instanceof ServiceValidationError ||
        error instanceof ServiceError ||
        error instanceof MoverUnauthorizedAccessError ||
        error instanceof MoverInvalidEstimateStatusError
      ) {
        throw error;
      }

      throw new ServiceError(
        "견적서 업데이트 중 오류가 발생했습니다",
        undefined,
        error
      );
    }
  },
};

export default moverEstimateService;

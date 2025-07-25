import moverEstimateRepository from "../repositories/moverEstimate.repository";
import { NotFoundError } from "../types/commonError.types";
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
      const estimate = await moverEstimateRepository.createEstimate(
        data.estimateRequestId,
        data.moverId,
        data.price,
        data.comment
      );
      if (!estimate) {
        throw new NotFoundError("견적 생성에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        // 비즈니스 로직 에러는 그대로 전달
        if (
          error.message === "이미 견적을 작성했습니다." ||
          error.message === "견적 요청을 찾을 수 없습니다." ||
          error.message === "활성 상태가 아닌 견적 요청입니다." ||
          error.message === "이사일이 지난 견적 요청입니다." ||
          error.message === "해당 견적에대한 일반견적 허용량을 초과했습니다" ||
          error.message === "해당 견적에대한 지정견적 허용량을 초과했습니다"
        ) {
          throw error;
        }
      }
      throw new Error("견적 생성 중 오류가 발생했습니다.");
    }
  },

  // 견적 반려
  rejectEstimate: async (
    data: TRejectEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      const estimate = await moverEstimateRepository.rejectEstimate(
        data.estimateRequestId,
        data.moverId,
        data.comment
      );
      if (!estimate) {
        throw new NotFoundError("견적 반려에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        // 비즈니스 로직 에러는 그대로 전달
        if (
          error.message === "이미 견적을 작성했습니다." ||
          error.message === "견적 요청을 찾을 수 없습니다." ||
          error.message === "활성 상태가 아닌 견적 요청입니다." ||
          error.message === "이사일이 지난 견적 요청입니다."
        ) {
          throw error;
        }
      }
      throw new Error("견적 반려 중 오류가 발생했습니다.");
    }
  },

  // 서비스 가능 지역 견적 조회
  getRegionEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ): Promise<TEstimateRequestResponse[]> => {
    const estimateRequests =
      await moverEstimateRepository.getRegionEstimateRequest(
        moverId,
        sortBy,
        customerName,
        movingType
      );
    // NotFoundError를 던지지 않고, 빈 배열 반환
    return estimateRequests || [];
  },

  // 지정 견적 조회
  getDesignatedEstimateRequest: async (
    moverId: string,
    sortBy?: "moveDate" | "createdAt",
    customerName?: string,
    movingType?: "SMALL" | "HOME" | "OFFICE"
  ): Promise<TEstimateRequestResponse[] | null> => {
    const estimateRequests =
      await moverEstimateRepository.getDesignatedEstimateRequest(
        moverId,
        sortBy,
        customerName,
        movingType
      );

    if (!estimateRequests || estimateRequests.length === 0) {
      throw new NotFoundError("지정 견적이 없습니다.");
    }

    return estimateRequests;
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
          regionEstimateRequests =
            (await moverEstimateRepository.getRegionEstimateRequest(
              moverId,
              sortBy,
              customerName,
              movingType
            )) || [];
        } catch (error) {
          console.error("지역 견적 조회 실패:", error);
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
          console.error("지정 견적 조회 실패:", error);
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
      console.error("getAllEstimateRequests service error:", error);
      throw error;
    }
  },

  // 견적 요청 상세 조회
  getEstimateRequestById: async (
    estimateRequestId: string
  ): Promise<TEstimateRequestResponse | null> => {
    const estimateRequest =
      await moverEstimateRepository.getEstimateRequestById(estimateRequestId);
    if (!estimateRequest) {
      throw new NotFoundError("견적 요청을 찾을 수 없습니다.");
    }
    return estimateRequest;
  },

  // 내가 보낸 견적서 조회
  getMyEstimate: async (moverId: string): Promise<TMyEstimateResponse[]> => {
    const estimates = await moverEstimateRepository.getMyEstimate(moverId);
    return estimates || [];
  },

  // 내가 반려한 견적 조회
  getMyRejectedEstimates: async (
    moverId: string
  ): Promise<TMyRejectedEstimateResponse[]> => {
    const rejectedEstimates =
      await moverEstimateRepository.getMyRejectedEstimates(moverId);
    return rejectedEstimates || [];
  },

  // 견적 상태 업데이트
  updateEstimateStatus: async (
    data: TUpdateEstimateStatusRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      const estimate = await moverEstimateRepository.updateEstimateStatus(
        data.estimateId,
        data.moverId,
        data.status
      );
      if (!estimate) {
        throw new NotFoundError("견적 상태 업데이트에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "해당 견적에 대한 권한이 없습니다.") {
          throw error;
        }
      }
      throw new Error("견적 상태 업데이트 중 오류가 발생했습니다.");
    }
  },

  // 견적서 업데이트
  updateEstimate: async (
    data: TUpdateEstimateRequest
  ): Promise<TEstimateResponse | null> => {
    try {
      const estimate = await moverEstimateRepository.updateEstimatePrice(
        data.estimateId,
        data.moverId,
        data.price,
        data.comment
      );
      if (!estimate) {
        throw new NotFoundError("견적서 업데이트에 실패했습니다.");
      }
      return estimate;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "해당 견적에 대한 권한이 없습니다." ||
          error.message === "수정 가능한 상태가 아닙니다."
        ) {
          throw error;
        }
      }
      throw new Error("견적서 업데이트 중 오류가 발생했습니다.");
    }
  },
};

export default moverEstimateService;

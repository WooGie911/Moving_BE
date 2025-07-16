import { MovingType, Quote, Region } from "@prisma/client";
import quoteRepository from "../repositories/quote.repository";
import {
  ICreateQuoteRequest,
  IUpdateQuoteRequest,
  IBackendQuoteData,
  IBackendUpdateQuoteData,
} from "../types/quote.types";

class QuoteService {
  async createQuote(quoteData: ICreateQuoteRequest, userId: number) {
    try {
      // 프론트엔드 데이터를 백엔드 형식으로 변환
      const backendData = this.convertToBackendFormat(quoteData);

      // 견적 요청 생성
      const createdQuote = await quoteRepository.createQuote(backendData, userId);

      return {
        success: true,
        message: "견적 요청이 성공적으로 생성되었습니다.",
        data: createdQuote,
      };
    } catch (error) {
      console.error("견적 요청 생성 서비스 오류:", error);
      return {
        success: false,
        message: "견적 요청 생성 중 오류가 발생했습니다.",
      };
    }
  }

  async getActiveQuote(userId: number) {
    try {
      const activeQuote = await quoteRepository.getActiveQuoteByUserId(userId);

      if (!activeQuote) {
        return {
          success: true,
          message: "활성 견적 요청이 없습니다.",
          data: null,
        };
      }

      return {
        success: true,
        message: "활성 견적 요청을 조회했습니다.",
        data: activeQuote,
      };
    } catch (error) {
      console.error("활성 견적 요청 조회 서비스 오류:", error);
      return {
        success: false,
        message: "활성 견적 요청 조회 중 오류가 발생했습니다.",
      };
    }
  }



  async updateActiveQuote(updateData: IUpdateQuoteRequest, userId: number) {
    try {
      // 활성 견적 요청 조회
      const activeQuote = await quoteRepository.getActiveQuoteByUserId(userId);

      if (!activeQuote) {
        return {
          success: false,
          message: "수정할 활성 견적 요청이 없습니다.",
        };
      }

      // 활성 상태가 아닌 경우 수정 불가
      if (activeQuote.status !== "ACTIVE") {
        return {
          success: false,
          message: "확정되거나 취소된 견적 요청은 수정할 수 없습니다.",
        };
      }

      // 프론트엔드 데이터를 백엔드 형식으로 변환
      const backendData = this.convertUpdateDataToBackendFormat(updateData);

      // 견적 요청 수정
      const updatedQuote = await quoteRepository.updateQuote(activeQuote.id, backendData);

      return {
        success: true,
        message: "견적 요청이 성공적으로 수정되었습니다.",
        data: updatedQuote,
      };
    } catch (error) {
      console.error("활성 견적 요청 수정 서비스 오류:", error);
      return {
        success: false,
        message: "견적 요청 수정 중 오류가 발생했습니다.",
      };
    }
  }

  async updateQuote(quoteId: number, updateData: IUpdateQuoteRequest, userId: number) {
    try {
      // 견적 요청 존재 여부 및 소유권 확인
      const existingQuote = await quoteRepository.getQuoteById(quoteId);

      if (!existingQuote) {
        return {
          success: false,
          message: "견적 요청을 찾을 수 없습니다.",
        };
      }

      if (existingQuote.userId !== userId) {
        return {
          success: false,
          message: "견적 요청을 수정할 권한이 없습니다.",
        };
      }

      // 활성 상태가 아닌 경우 수정 불가
      if (existingQuote.status !== "ACTIVE") {
        return {
          success: false,
          message: "확정되거나 취소된 견적 요청은 수정할 수 없습니다.",
        };
      }

      // 프론트엔드 데이터를 백엔드 형식으로 변환
      const backendData = this.convertUpdateDataToBackendFormat(updateData);

      // 견적 요청 수정
      const updatedQuote = await quoteRepository.updateQuote(quoteId, backendData);

      return {
        success: true,
        message: "견적 요청이 성공적으로 수정되었습니다.",
        data: updatedQuote,
      };
    } catch (error) {
      console.error("견적 요청 수정 서비스 오류:", error);
      return {
        success: false,
        message: "견적 요청 수정 중 오류가 발생했습니다.",
      };
    }
  }

  async cancelActiveQuote(userId: number) {
    try {
      // 활성 견적 요청 조회
      const activeQuote = await quoteRepository.getActiveQuoteByUserId(userId);

      if (!activeQuote) {
        return {
          success: false,
          message: "취소할 활성 견적 요청이 없습니다.",
        };
      }

      // 견적 요청 취소
      const cancelledQuote = await quoteRepository.cancelQuote(activeQuote.id);

      return {
        success: true,
        message: "견적 요청이 성공적으로 취소되었습니다.",
        data: cancelledQuote,
      };
    } catch (error) {
      console.error("견적 요청 취소 서비스 오류:", error);
      return {
        success: false,
        message: "견적 요청 취소 중 오류가 발생했습니다.",
      };
    }
  }

  private convertToBackendFormat(frontendData: ICreateQuoteRequest): IBackendQuoteData {
    // movingType을 대문자로 변환
    const movingType = frontendData.movingType.toUpperCase() as MovingType;

    // 주소 정보 분리
    const departureAddress = frontendData.departure.roadAddress;
    const arrivalAddress = frontendData.arrival.roadAddress;
    const departureDetail = frontendData.departure.detailAddress;
    const arrivalDetail = frontendData.arrival.detailAddress;

    // 지역 정보 추출 (extraAddress에서)
    const departureRegion = this.extractRegion(frontendData.departure.extraAddress);
    const arrivalRegion = this.extractRegion(frontendData.arrival.extraAddress);

    return {
      movingType,
      departureAddress,
      arrivalAddress,
      departureDetail,
      arrivalDetail,
      departureRegion,
      arrivalRegion,
      movingDate: frontendData.movingDate,
      description: frontendData.description,
    };
  }

  private convertUpdateDataToBackendFormat(updateData: IUpdateQuoteRequest): IBackendUpdateQuoteData {
    const result: IBackendUpdateQuoteData = {};

    if (updateData.movingType) {
      result.movingType = updateData.movingType.toUpperCase() as MovingType;
    }

    if (updateData.departure) {
      result.departureAddress = updateData.departure.roadAddress;
      result.departureDetail = updateData.departure.detailAddress;
      result.departureRegion = this.extractRegion(updateData.departure.extraAddress);
    }

    if (updateData.arrival) {
      result.arrivalAddress = updateData.arrival.roadAddress;
      result.arrivalDetail = updateData.arrival.detailAddress;
      result.arrivalRegion = this.extractRegion(updateData.arrival.extraAddress);
    }

    if (updateData.movingDate) {
      result.movingDate = updateData.movingDate;
    }

    if (updateData.description !== undefined) {
      result.description = updateData.description;
    }

    return result;
  }

  private extractRegion(extraAddress: string): Region | undefined {
    // extraAddress에서 지역 정보 추출
    // 예: "역삼동" -> "SEOUL", "서초동" -> "SEOUL"
    // 실제 구현에서는 더 정확한 매핑이 필요할 수 있습니다
    if (extraAddress.includes("강남") || extraAddress.includes("서초") || extraAddress.includes("역삼")) {
      return "SEOUL";
    }
    // 다른 지역들도 필요에 따라 추가
    return undefined;
  }
}

export default QuoteService;

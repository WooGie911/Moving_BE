import { IAddressInfo } from "../types/estimateRequest.types";
import { isBeforeKoreaToday } from "./dateUtils";

/**
 * 주소 정보 검증 결과 인터페이스
 */
export interface IAddressValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 날짜 검증 결과 인터페이스
 */
export interface IDateValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 견적 요청 검증 결과 인터페이스
 */
export interface IEstimateRequestValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 두 문자열을 안전하게 비교합니다.
 * @param a 첫 번째 문자열
 * @param b 두 번째 문자열
 * @returns 동일하면 true, 아니면 false
 */
const safeStringEquals = (a: string | undefined, b: string | undefined): boolean => {
  return (a || "").toString().trim() === (b || "").toString().trim();
};

/**
 * 이사일이 유효한지 검증합니다.
 * @param movingDate 이사일 (YYYY-MM-DD 형식)
 * @returns 검증 결과
 */
export const validateMovingDate = (movingDate: string): IDateValidationResult => {
  try {
    const moveDate = new Date(movingDate);

    if (isNaN(moveDate.getTime())) {
      return {
        isValid: false,
        errorMessage: "올바른 날짜 형식이 아닙니다. (YYYY-MM-DD 형식으로 입력해주세요)",
      };
    }

    if (isBeforeKoreaToday(moveDate)) {
      return {
        isValid: false,
        errorMessage: "이사일은 오늘 이후로 설정해주세요.",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      errorMessage: "날짜 검증 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 출발지와 도착지 주소가 동일한지 검증합니다.
 * @param departure 출발지 주소
 * @param arrival 도착지 주소
 * @returns 검증 결과
 */
export const validateAddresses = (departure: IAddressInfo, arrival: IAddressInfo): IAddressValidationResult => {
  const isSameRoadAddress = safeStringEquals(departure?.roadAddress, arrival?.roadAddress);
  const isSameDetailAddress = safeStringEquals(departure?.detailAddress, arrival?.detailAddress);

  if (isSameRoadAddress && isSameDetailAddress) {
    return {
      isValid: false,
      errorMessage: "출발지와 도착지는 달라야 합니다.",
    };
  }

  return { isValid: true };
};

/**
 * 견적 요청 생성 데이터를 검증합니다.
 * @param data 견적 요청 데이터
 * @returns 검증 결과
 */
export const validateCreateEstimateRequest = (data: {
  movingType: string;
  movingDate: string;
  departure: IAddressInfo;
  arrival: IAddressInfo;
  description?: string;
}): IEstimateRequestValidationResult => {
  const errors: string[] = [];

  // 이사 종류 검증
  if (!data.movingType || !["small", "home", "office"].includes(data.movingType.toLowerCase())) {
    errors.push("이사 종류는 small, home, office 중 하나여야 합니다.");
  }

  // 이사일 검증
  const dateValidation = validateMovingDate(data.movingDate);
  if (!dateValidation.isValid) {
    errors.push(dateValidation.errorMessage!);
  }

  // 주소 검증
  const addressValidation = validateAddresses(data.departure, data.arrival);
  if (!addressValidation.isValid) {
    errors.push(addressValidation.errorMessage!);
  }

  // 출발지 주소 검증
  if (!data.departure?.roadAddress?.trim()) {
    errors.push("출발지 주소는 필수입니다.");
  }

  // 도착지 주소 검증
  if (!data.arrival?.roadAddress?.trim()) {
    errors.push("도착지 주소는 필수입니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 견적 요청 수정 데이터를 검증합니다.
 * @param data 견적 요청 수정 데이터
 * @returns 검증 결과
 */
export const validateUpdateEstimateRequest = (data: {
  movingType?: string;
  movingDate?: string;
  departure?: IAddressInfo;
  arrival?: IAddressInfo;
  description?: string;
}): IEstimateRequestValidationResult => {
  const errors: string[] = [];

  // 이사 종류 검증 (제공된 경우에만)
  if (data.movingType && !["small", "home", "office"].includes(data.movingType.toLowerCase())) {
    errors.push("이사 종류는 small, home, office 중 하나여야 합니다.");
  }

  // 이사일 검증 (제공된 경우에만)
  if (data.movingDate) {
    const dateValidation = validateMovingDate(data.movingDate);
    if (!dateValidation.isValid) {
      errors.push(dateValidation.errorMessage!);
    }
  }

  // 주소 검증 (둘 다 제공된 경우에만)
  if (data.departure && data.arrival) {
    const addressValidation = validateAddresses(data.departure, data.arrival);
    if (!addressValidation.isValid) {
      errors.push(addressValidation.errorMessage!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 사용자 ID가 유효한지 검증합니다.
 * @param userId 사용자 ID
 * @returns 검증 결과
 */
export const validateUserId = (userId: string): boolean => {
  return !!userId && typeof userId === "string" && userId.trim().length > 0;
};

/**
 * 견적 요청 상태가 수정 가능한지 확인합니다.
 * @param status 현재 견적 요청 상태
 * @returns 수정 가능하면 true, 아니면 false
 */
export const isStatusModifiable = (status: string): boolean => {
  return status === "PENDING";
};

/**
 * 견적 요청 상태가 취소 가능한지 확인합니다.
 * @param status 현재 견적 요청 상태
 * @param hasEstimateFromMover 기사님이 견적을 제출했는지 여부
 * @returns 취소 가능하면 true, 아니면 false
 */
export const isStatusCancellable = (status: string, hasEstimateFromMover: boolean): boolean => {
  return status === "PENDING" && !hasEstimateFromMover;
};

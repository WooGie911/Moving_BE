// HTTP Status Code 상수
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 기본 에러 코드 enum
export enum ErrorCode {
  // Repository 레이어 에러 (1000번대)
  REPOSITORY_DATABASE_ERROR = "REPO_1001",
  REPOSITORY_QUERY_ERROR = "REPO_1002",
  REPOSITORY_CONNECTION_ERROR = "REPO_1003",
  REPOSITORY_DATA_NOT_FOUND = "REPO_1004",

  // Service 레이어 에러 (2000번대)
  SERVICE_BUSINESS_LOGIC_ERROR = "SVC_2001",
  SERVICE_VALIDATION_ERROR = "SVC_2002",
  SERVICE_DATA_PROCESSING_ERROR = "SVC_2003",
  SERVICE_EXTERNAL_API_ERROR = "SVC_2004",

  // Controller 레이어 에러 (3000번대)
  CONTROLLER_REQUEST_ERROR = "CTRL_3001",
  CONTROLLER_RESPONSE_ERROR = "CTRL_3002",
  CONTROLLER_AUTH_ERROR = "CTRL_3003",
  CONTROLLER_VALIDATION_ERROR = "CTRL_3004",

  // Mover 전용 에러 코드들 (4000번대)
  MOVER_ESTIMATE_DUPLICATE = "MOVER_4001",
  MOVER_ESTIMATE_QUOTA_EXCEEDED = "MOVER_4002",
  MOVER_INVALID_ESTIMATE_REQUEST = "MOVER_4003",
  MOVER_EXPIRED_ESTIMATE_REQUEST = "MOVER_4004",
  MOVER_UNAUTHORIZED_ACCESS = "MOVER_4005",
  MOVER_INVALID_ESTIMATE_STATUS = "MOVER_4006",
  MOVER_NO_SERVICE_AREA = "MOVER_4007",
  MOVER_NO_DESIGNATED_REQUEST = "MOVER_4008",
}

// 기본 커스텀 에러 클래스
abstract class BaseCustomError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly layer: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;

    // 스택 트레이스에서 이 클래스 제거
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // 에러 정보를 구조화된 객체로 반환
  toJSON() {
    const result: any = {
      name: this.name,
      message: this.message,
      code: this.code,
      layer: this.layer,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString(),
    };

    if (this.originalError) {
      result.originalError = this.originalError;
    }

    return result;
  }
}

// Repository 레이어 에러들
export class RepositoryError extends BaseCustomError {
  readonly layer = "REPOSITORY";
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

  constructor(
    message: string,
    public readonly code: ErrorCode = ErrorCode.REPOSITORY_DATABASE_ERROR,
    originalError?: unknown
  ) {
    super(`[Repository 오류] ${message}`, originalError);
  }
}

export class RepositoryQueryError extends RepositoryError {
  readonly code = ErrorCode.REPOSITORY_QUERY_ERROR;

  constructor(message: string, originalError?: unknown) {
    super(
      `데이터베이스 쿼리 실패: ${message}`,
      ErrorCode.REPOSITORY_QUERY_ERROR,
      originalError
    );
  }
}

export class RepositoryDataNotFoundError extends BaseCustomError {
  readonly code = ErrorCode.REPOSITORY_DATA_NOT_FOUND;
  readonly layer = "REPOSITORY";
  readonly statusCode = HTTP_STATUS.NOT_FOUND;

  constructor(message: string, originalError?: unknown) {
    super(
      `[Repository 오류] 데이터를 찾을 수 없습니다: ${message}`,
      originalError
    );
  }
}

export class RepositoryConnectionError extends RepositoryError {
  readonly code = ErrorCode.REPOSITORY_CONNECTION_ERROR;

  constructor(message: string, originalError?: unknown) {
    super(
      `데이터베이스 연결 실패: ${message}`,
      ErrorCode.REPOSITORY_CONNECTION_ERROR,
      originalError
    );
  }
}

// Service 레이어 에러들
export class ServiceError extends BaseCustomError {
  readonly layer = "SERVICE";
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

  constructor(
    message: string,
    public readonly code: ErrorCode = ErrorCode.SERVICE_BUSINESS_LOGIC_ERROR,
    originalError?: unknown
  ) {
    super(`[Service 오류] ${message}`, originalError);
  }
}

export class ServiceValidationError extends BaseCustomError {
  readonly code = ErrorCode.SERVICE_VALIDATION_ERROR;
  readonly layer = "SERVICE";
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(message: string, originalError?: unknown) {
    super(`[Service 오류] 비즈니스 검증 실패: ${message}`, originalError);
  }
}

export class ServiceDataProcessingError extends ServiceError {
  readonly code = ErrorCode.SERVICE_DATA_PROCESSING_ERROR;

  constructor(message: string, originalError?: unknown) {
    super(
      `데이터 처리 실패: ${message}`,
      ErrorCode.SERVICE_DATA_PROCESSING_ERROR,
      originalError
    );
  }
}

export class ServiceExternalApiError extends ServiceError {
  readonly code = ErrorCode.SERVICE_EXTERNAL_API_ERROR;

  constructor(message: string, originalError?: unknown) {
    super(
      `외부 API 호출 실패: ${message}`,
      ErrorCode.SERVICE_EXTERNAL_API_ERROR,
      originalError
    );
  }
}

// Controller 레이어 에러들
export class ControllerError extends BaseCustomError {
  readonly layer = "CONTROLLER";
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

  constructor(
    message: string,
    public readonly code: ErrorCode = ErrorCode.CONTROLLER_REQUEST_ERROR,
    originalError?: unknown
  ) {
    super(`[Controller 오류] ${message}`, originalError);
  }
}

export class ControllerAuthError extends BaseCustomError {
  readonly code = ErrorCode.CONTROLLER_AUTH_ERROR;
  readonly layer = "CONTROLLER";
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED;

  constructor(message: string, originalError?: unknown) {
    super(`[Controller 오류] 인증 실패: ${message}`, originalError);
  }
}

export class ControllerValidationError extends BaseCustomError {
  readonly code = ErrorCode.CONTROLLER_VALIDATION_ERROR;
  readonly layer = "CONTROLLER";
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(message: string, originalError?: unknown) {
    super(`[Controller 오류] 요청 검증 실패: ${message}`, originalError);
  }
}

export class ControllerResponseError extends ControllerError {
  readonly code = ErrorCode.CONTROLLER_RESPONSE_ERROR;

  constructor(message: string, originalError?: unknown) {
    super(
      `응답 처리 실패: ${message}`,
      ErrorCode.CONTROLLER_RESPONSE_ERROR,
      originalError
    );
  }
}

// 기존 호환성을 위한 NotFoundError는 유지
export class NotFoundError extends BaseCustomError {
  readonly code = ErrorCode.SERVICE_BUSINESS_LOGIC_ERROR;
  readonly layer = "SERVICE";
  readonly statusCode = HTTP_STATUS.NOT_FOUND;

  constructor(message: string, originalError?: unknown) {
    super(
      `[Service 오류] 리소스를 찾을 수 없습니다: ${message}`,
      originalError
    );
  }
}

// ===== Mover 전용 에러 클래스들 =====

// 견적 중복 생성 에러
export class MoverEstimateDuplicateError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_ESTIMATE_DUPLICATE;
  readonly layer = "REPOSITORY";
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(
    message: string = "이미 견적을 작성했습니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// 견적 허용량 초과 에러
export class MoverEstimateQuotaExceededError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_ESTIMATE_QUOTA_EXCEEDED;
  readonly layer = "REPOSITORY";
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(
    message: string = "견적 허용량을 초과했습니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// 유효하지 않은 견적 요청 에러
export class MoverInvalidEstimateRequestError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_INVALID_ESTIMATE_REQUEST;
  readonly layer = "REPOSITORY";
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(
    message: string = "견적 요청을 찾을 수 없거나 활성 상태가 아닙니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// 만료된 견적 요청 에러
export class MoverExpiredEstimateRequestError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_EXPIRED_ESTIMATE_REQUEST;
  readonly layer = "REPOSITORY";
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(
    message: string = "이사일이 지난 견적 요청입니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// 기사 권한 에러
export class MoverUnauthorizedAccessError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_UNAUTHORIZED_ACCESS;
  readonly layer = "CONTROLLER";
  readonly statusCode = HTTP_STATUS.FORBIDDEN;

  constructor(
    message: string = "현재 유저타입이 기사가 아닙니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// 견적 상태 에러
export class MoverInvalidEstimateStatusError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_INVALID_ESTIMATE_STATUS;
  readonly layer = "REPOSITORY";
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(
    message: string = "해당 견적에 대한 권한이 없거나 수정 가능한 상태가 아닙니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// 서비스 지역 없음 에러
export class MoverNoServiceAreaError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_NO_SERVICE_AREA;
  readonly layer = "SERVICE";
  readonly statusCode = HTTP_STATUS.NOT_FOUND;

  constructor(
    message: string = "서비스 가능 지역 견적이 없습니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// 지정 견적 없음 에러
export class MoverNoDesignatedRequestError extends BaseCustomError {
  readonly code = ErrorCode.MOVER_NO_DESIGNATED_REQUEST;
  readonly layer = "SERVICE";
  readonly statusCode = HTTP_STATUS.NOT_FOUND;

  constructor(
    message: string = "지정 견적이 없습니다",
    originalError?: unknown
  ) {
    super(`[기사 오류] ${message}`, originalError);
  }
}

// src/types/errors.ts

/**
 * 기본 애플리케이션 에러 클래스, 공통 코드/데이터 포함
 */
export class AppError extends Error {
  code?: number; // 선택적 속성으로 변경
  data?: any; // 에러핸들러에서 사용하는 data 속성도 추가

  constructor(message: string, code?: number, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "AppError";
  }
}

// 자주 사용하는 에러들을 위한 편의 클래스들

/**
 * 유효성 검사 실패 시 사용 (HTTP 422)
 */
export class ValidationError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 422, data); // 422는 기본값
    this.name = "ValidationError";
  }
}

/**
 * 인증 실패(로그인 필요) 시 사용 (HTTP 401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 401, data); // 401은 기본값
    this.name = "AuthenticationError";
  }
}

/**
 * 요청한 리소스를 찾을 수 없을 때 사용 (HTTP 404)
 */
export class NotFoundError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 404, data); // 404은 기본값
    this.name = "NotFoundError";
  }
}

/**
 * 권한이 없을 때 사용 (HTTP 403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 403, data); // 403은 기본값
    this.name = "ForbiddenError";
  }
}

/**
 * 서버 내부 에러 시 사용 (HTTP 500)
 */
export class ServerError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 500, data); // 500은 기본값
    this.name = "ServerError";
  }
}

/**
 * 데이터베이스 관련 에러 시 사용 (HTTP 500)
 */
export class DatabaseError extends AppError {
  constructor(message: string, data?: any) {
    super(message, 500, data); // 500은 기본값
    this.name = "DatabaseError";
  }
}

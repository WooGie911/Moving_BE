/**
 * 커스텀 에러 인터페이스
 */
export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * API 에러 응답 인터페이스
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    status: number;
    stack?: string;
  };
  timestamp: string;
}

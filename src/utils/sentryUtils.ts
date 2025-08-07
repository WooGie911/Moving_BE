import * as Sentry from "@sentry/node";

/**
 * 센트리 성능 모니터링을 위한 트랜잭션 생성
 * @param name 트랜잭션 이름
 * @param operation 작업 유형
 * @returns Sentry 트랜잭션
 */
export const createSentryTransaction = (name: string, operation: string) => {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
};

/**
 * 센트리 스팬 생성 (세부 작업 추적)
 * @param name 스팬 이름
 * @param operation 작업 유형
 * @returns Sentry 스팬
 */
export const createSentrySpan = (name: string, operation: string) => {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
  if (!transaction) return null;

  return transaction.startChild({
    name,
    op: operation,
  });
};

/**
 * 견적 요청 관련 에러를 센트리로 전송
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export const captureEstimateRequestError = (
  error: Error,
  context: {
    userId?: string;
    userType?: string;
    requestBody?: any;
    url?: string;
    method?: string;
    operation: string;
  },
) => {
  Sentry.captureException(error, {
    extra: {
      userId: context.userId,
      body: context.requestBody,
      url: context.url,
      method: context.method,
    },
    tags: {
      error_type: "estimate_request_error",
      operation: context.operation,
      user_type: context.userType || "unknown",
    },
  });
};

/**
 * 데이터베이스 쿼리 에러를 센트리로 전송
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export const captureDatabaseError = (
  error: Error,
  context: {
    operation: string;
    table?: string;
    userId?: string;
  },
) => {
  Sentry.captureException(error, {
    extra: {
      userId: context.userId,
      table: context.table,
    },
    tags: {
      error_type: "database_error",
      operation: context.operation,
    },
  });
};

/**
 * 인증 관련 에러를 센트리로 전송
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export const captureAuthError = (
  error: Error,
  context: {
    operation: string;
    userId?: string;
    token?: string;
  },
) => {
  Sentry.captureException(error, {
    extra: {
      userId: context.userId,
      token: context.token ? "***" : undefined, // 토큰은 마스킹
    },
    tags: {
      error_type: "authentication_error",
      operation: context.operation,
    },
  });
};

/**
 * 알림 생성 관련 에러를 센트리로 전송
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export const captureNotificationError = (
  error: Error,
  context: {
    operation: string;
    actionType?: string;
    userId?: string;
    userType?: string;
    notificationType?: string;
  },
) => {
  Sentry.captureException(error, {
    extra: {
      userId: context.userId,
      actionType: context.actionType,
      notificationType: context.notificationType,
    },
    tags: {
      error_type: "notification_error",
      operation: context.operation,
      user_type: context.userType || "unknown",
    },
  });
};

/**
 * SSE 관련 에러를 센트리로 전송
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export const captureSSEError = (
  error: Error,
  context: {
    operation: string;
    userId?: string;
    notificationId?: string;
  },
) => {
  Sentry.captureException(error, {
    extra: {
      userId: context.userId,
      notificationId: context.notificationId,
    },
    tags: {
      error_type: "sse_error",
      operation: context.operation,
    },
  });
};

/**
 * 알림 액션 매핑 관련 에러를 센트리로 전송
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export const captureActionMappingError = (
  error: Error,
  context: {
    operation: string;
    actionType?: string;
    entityId?: string;
    entityType?: string;
  },
) => {
  Sentry.captureException(error, {
    extra: {
      actionType: context.actionType,
      entityId: context.entityId,
      entityType: context.entityType,
    },
    tags: {
      error_type: "action_mapping_error",
      operation: context.operation,
    },
  });
};

/**
 * 사용자 컨텍스트 설정
 * @param userId 사용자 ID
 * @param userType 사용자 타입
 * @param email 이메일 (선택사항)
 */
export const setUserContext = (userId: string, userType: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    userType,
    email,
  });
};

/**
 * 센트리 태그 설정
 * @param tags 태그 객체
 */
export const setSentryTags = (tags: Record<string, string>) => {
  Sentry.setTags(tags);
};

/**
 * 센트리 컨텍스트 설정
 * @param context 컨텍스트 객체
 */
export const setSentryContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

/**
 * 리뷰 관련 에러를 센트리로 전송
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export const captureReviewError = (
  error: Error,
  context: {
    operation: string;
    userId?: string;
    reviewId?: string;
    moverId?: string;
    customerId?: string;
    requestBody?: any;
    url?: string;
    method?: string;
  },
) => {
  Sentry.captureException(error, {
    extra: {
      userId: context.userId,
      reviewId: context.reviewId,
      moverId: context.moverId,
      customerId: context.customerId,
      body: context.requestBody,
      url: context.url,
      method: context.method,
    },
    tags: {
      error_type: "review_error",
      operation: context.operation,
    },
  });
};

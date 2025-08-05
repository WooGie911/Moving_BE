import * as Sentry from "@sentry/node";

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: "https://d240816eb50c74167d7383ea775e8a64@o4509788725706752.ingest.us.sentry.io/4509788727934976",
  environment: process.env.NODE_ENV || "development",

  // 성능 모니터링 설정
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 에러 샘플링 설정
  sampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === "development",

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // 민감한 정보 제거
  beforeSend(event: any) {
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    return event;
  },
});

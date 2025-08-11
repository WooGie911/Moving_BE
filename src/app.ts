import dotenv from "dotenv";

// 환경변수 로드
dotenv.config();

// Sentry 초기화를 먼저 실행 (Express import 전에)
import "./instrument";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware";
import { setupManualSwagger } from "./utils/swagger-manual";
import cookieParser from "cookie-parser";
import { cache } from "./middlewares/cacheMiddleware";

// 라우터 import
import authIndexRoutes from "./routes/authIndex.routes";
import notificationIndexRoutes from "./routes/notificationIndex.routes";
import businessRoutes from "./routes/index.routes";
import passport from "./config/passport";

const app = express();

// 보안 헤더 설정 (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // CORS 호환성을 위해 비활성화
  }),
);

// 로깅 설정 (Morgan)
app.use(morgan("combined")); // 프로덕션용 로그 포맷

// CORS 설정 - 환경변수에서 가져오거나 기본값 사용
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || [
  "https://gomoving.site",
  "https://www.gomoving.site",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // ngrok 테스트용 cors 설정
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".ngrok-free.app")) {
        callback(null, true);
      } else {
        console.warn(`CORS 차단된 origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "XSRF-TOKEN"],
    exposedHeaders: ["X-CSRF-Token"],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // JSON 파싱 (크기 제한 추가)
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // URL 인코딩 파싱 (크기 제한 추가)

app.use(passport.initialize());

// Swagger 수동 설정 (API 라우트들을 자동으로 스캔)
setupManualSwagger(app);

// API 라우트 연결
app.use("/", authIndexRoutes); // 인증/인가 관련 라우터
app.use("/", notificationIndexRoutes); // 알림 관련 라우터
app.use("/", businessRoutes); // 일반 비즈니스 로직 라우터 (헬스 체크 포함)

// 404 에러 핸들링 (전역 에러 핸들러로 전달)
app.use(notFoundHandler);

// 전역 에러 핸들링 (모든 에러를 통합 처리)
app.use(errorHandler);

export default app;

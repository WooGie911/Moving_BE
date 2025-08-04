import dotenv from "dotenv";

// 환경변수 로드
dotenv.config();

import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware";
import { setupManualSwagger } from "./utils/swagger-manual";
import cookieParser from "cookie-parser";
import { initializeScheduler } from "./utils/scheduler";

// 라우터 import
import authIndexRoutes from "./routes/authIndex.routes";
import notificationIndexRoutes from "./routes/notificationIndex.routes";
import businessRoutes from "./routes/index.routes";
import passport from "./config/passport";

const app = express();
const PORT = process.env.PORT || 5050;

// CORS 설정 - 환경변수에서 가져오거나 기본값 사용
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || [];

app.use(
  cors({
    origin: (origin, callback) => {
      // ngrok 테스트용 cors 설정
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".ngrok-free.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

app.use(passport.initialize());

// Swagger 수동 설정 (API 라우트들을 자동으로 스캔)
setupManualSwagger(app);

// API 라우트 연결
app.use("/", authIndexRoutes); // 인증/인가 관련 라우터
app.use("/", notificationIndexRoutes); // 알림 관련 라우터
app.use("/", businessRoutes); // 일반 비즈니스 로직 라우터 (헬스 체크 포함)

// 404 에러 핸들링
app.use(notFoundHandler);

// 전역 에러 핸들링
app.use(errorHandler);

// 스케줄러 초기화
initializeScheduler();

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 실행되었습니다. 포트번호 ${PORT} 에서 실행중입니다.`);
});

export default app;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware";
import { setupAutoSwagger } from "./utils/swagger-auto";
import authRouter from "./routes/auth.route";

// 환경변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// 기본 미들웨어 설정
const allowedOrigins = [
  "http://localhost:3000", // 로컬 개발
  "https://your-deployed-domain.com", // 배포시 교체
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman, 서버 내부 요청 허용
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS 정책에 의해 차단된 Origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

// Health Check 엔드포인트
/**
 * GET /health
 * @summary 서버 상태 확인
 * @tags Health
 * @return {object} 200 - 서버 정상 작동
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger 자동 설정 (API 라우트들을 자동으로 스캔)
setupAutoSwagger(app);

// API 라우트 연결
// app.use('/api/users', userRoutes);
app.use("/auth", authRouter);

// 404 에러 핸들링
app.use(notFoundHandler);

// 전역 에러 핸들링
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 실행되었습니다. 포트번호 ${PORT} 에서 실행중입니다.`);
});

export default app;

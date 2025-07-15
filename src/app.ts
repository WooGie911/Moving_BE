import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware";
import { setupAutoSwagger } from "./utils/swagger-auto";
import authRouter from "./routes/auth.route";
import moverRouter from "./routes/mover.routes";
import userRouter from "./routes/user.route";
import cookieParser from "cookie-parser";
import reviewRouter from "./routes/review.route";
import userQuoteRouter from "./routes/userQuote.route";
import quoteRouter from "./routes/quote.routes";
import moverEstimateRouter from "./routes/moverEstimate.routes";

// 환경변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "https://gomoving.site", // 기본값
];

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
  })
);

app.use(cookieParser());
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
app.use("/movers", moverRouter); // TODO: 추후 authMiddleware 추가
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);
app.use("/customer-quotes", userQuoteRouter);
app.use("/quotes", quoteRouter);
app.use("/mover-estimates", moverEstimateRouter);

// 404 에러 핸들링
app.use(notFoundHandler);

// 전역 에러 핸들링
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 실행되었습니다. 포트번호 ${PORT} 에서 실행중입니다.`);
});

export default app;

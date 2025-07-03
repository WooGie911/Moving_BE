import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware";

// 환경변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// 기본 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

// Health Check 엔드포인트
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API 라우트 연결 (향후 추가)
// app.use('/api/users', userRoutes);
// app.use('/api/auth', authRoutes);

// 404 에러 핸들링
app.use(notFoundHandler);

// 전역 에러 핸들링
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 실행되었습니다. 포트번호 ${PORT} 에서 실행중입니다.`);
});

export default app;

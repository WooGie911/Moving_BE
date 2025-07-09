import expressJSDocSwagger from "express-jsdoc-swagger";
import { Express } from "express";

const swaggerOptions = {
  info: {
    version: "1.0.0",
    title: "Moving API",
    description: "Moving 프로젝트 백엔드 API 문서 (자동 생성)",
    license: {
      name: "MIT",
    },
  },
  security: {
    BearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  baseDir: __dirname + "/../", // src 디렉토리
  // 스캔할 파일들
  filesPattern: ["./routes/**/*.ts", "./controllers/**/*.ts", "./app.ts"],
  // Swagger UI 설정
  swaggerUIPath: "/api-docs",
  // API 기본 경로
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://your-production-domain.com"
      : `http://localhost:${process.env.PORT || 5050}`,
  // 추가 옵션
  exposeSwaggerUI: true,
  exposeApiDocs: true,
  apiDocsPath: "/api-docs.json",
};

export const setupAutoSwagger = (app: Express) => {
  return expressJSDocSwagger(app)(swaggerOptions);
};

export default swaggerOptions;

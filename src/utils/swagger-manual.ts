import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

// 환경별 파일 경로 설정
const isDevelopment = process.env.NODE_ENV !== "production";
const basePath = isDevelopment ? "./src" : "./dist";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Moving Backend API",
      description: `
        무빙. 이삿짐 서비스의 백엔드 API 서버입니다.
        
        ## 주요 기능
        - **견적 요청 관리**: 생성, 조회, 수정, 취소
        - **견적 제출**: 기사님이 고객에게 견적 제출
        - **사용자 관리**: 회원가입, 로그인, 프로필 관리
        - **기사님 관리**: 기사님 정보 조회, 찜하기 기능
        - **알림 시스템**: 실시간 SSE 알림 및 푸시 알림
        - **리뷰 시스템**: 이사 완료 후 리뷰 작성
        - **권한 관리**: 고객/기사님 역할 기반 접근 제어
      `,
      contact: {
        name: "API Support",
        email: "support@moving.com",
      },
      license: {
        name: "FS6기 1팀",
        url: "https://github.com/WooGie911/Moving_BE",
      },
    },
    servers: [
      {
        url: "http://localhost:5050",
        description: "Development server",
      },
      {
        url: "https://api.gomoving.site",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT 토큰을 Bearer 형식으로 전송",
        },
      },
    },
    tags: [
      {
        name: "EstimateRequest",
        description:
          "견적 요청 관련 API - 고객이 이사 견적을 요청하고 관리하는 API",
      },
      {
        name: "Auth",
        description: "인증 관련 API - 회원가입, 로그인, 소셜 로그인, 토큰 관리",
      },
      {
        name: "User",
        description:
          "사용자 관련 API - 사용자 정보 조회, 프로필 관리, 이미지 업로드",
      },
      {
        name: "Mover",
        description:
          "기사님 관련 API - 기사님 목록 조회, 상세 정보, 지정 견적 요청",
      },
      {
        name: "MoverEstimate",
        description:
          "견적 제출 관련 API - 기사님이 고객에게 견적을 제출하고 관리하는 API",
      },
      {
        name: "Favorites",
        description: "찜하기 관련 API - 기사님 찜하기 추가/제거, 상태 확인",
      },
      {
        name: "Notification",
        description:
          "알림 관련 API - 실시간 SSE 알림, 알림 목록 조회 및 읽음 처리",
      },
      {
        name: "Review",
        description: "리뷰 관련 API - 이사 완료 후 리뷰 작성, 리뷰 목록 조회",
      },
      {
        name: "UserQuote",
        description:
          "고객 견적 관련 API - 진행중/완료된 견적 요청 조회, 견적 확정",
      },
      {
        name: "Health",
        description: "서버 상태 확인 API - 서버 상태 및 헬스 체크",
      },
    ],
    externalDocs: {
      description: "협업 노션",
      url: "https://www.notion.so/Part4-Team1-Moving-2155da6dc98c80fa89c2f08319b1ef83",
    },
  },
  apis: [
    `${basePath}/routes/*.ts`,
    `${basePath}/routes/*.js`,
    `${basePath}/controllers/*.ts`,
    `${basePath}/controllers/*.js`,
  ],
};

const specs = swaggerJsdoc(options);

export const setupManualSwagger = (app: Express) => {
  // 환경변수로 Swagger 활성화 제어 (기본값: 개발환경에서만 활성화)
  const enableSwagger = process.env.ENABLE_SWAGGER === "true" || isDevelopment;

  if (!enableSwagger) {
    console.log("🚫 Swagger가 비활성화되었습니다. (프로덕션 환경)");
    return;
  }

  console.log("📚 Swagger 문서가 활성화되었습니다.");
  console.log(`📖 Swagger UI: /api-docs`);
  console.log(`📄 Swagger JSON: /api-docs.json`);

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        displayRequestDuration: true,
      },
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #3b82f6; }
      `,
      customSiteTitle: "Moving API Documentation",
    })
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};

export default specs;

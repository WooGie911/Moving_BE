import expressJSDocSwagger from "express-jsdoc-swagger";
import { Express } from "express";

const swaggerOptions = {
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

      ## 인증
      모든 API는 JWT 토큰 인증이 필요합니다.
      Authorization 헤더에 Bearer 토큰을 포함하여 요청하세요.
      
      ### 토큰 관리
      - 액세스 토큰: API 요청 시 사용 (짧은 유효기간)
      - 리프레시 토큰: 액세스 토큰 갱신용 (긴 유효기간)
      - HTTP-only 쿠키로 자동 관리

      ## API 그룹별 설명

      ### 🔐 인증 API (Auth)
      - 회원가입, 로그인, 로그아웃
      - 소셜 로그인 (구글, 카카오, 네이버)
      - 토큰 갱신

      ### 👤 사용자 API (User)
      - 사용자 정보 조회 및 수정
      - 프로필 관리 (일반 고객/기사님)
      - 이미지 업로드 (Presigned URL)

      ### 📋 견적 요청 API (EstimateRequest)
      - 견적 요청 생성, 조회, 수정, 취소
      - 주소 자동 파싱 및 데이터베이스 저장
      - Soft Delete를 통한 데이터 보존

      ### 💰 견적 제출 API (MoverEstimate)
      - 기사님이 고객에게 견적 제출
      - 지역별/지정 견적 조회
      - 견적 상태 관리 및 업데이트

      ### 🚛 기사님 API (Mover)
      - 기사님 목록 조회 및 상세 정보
      - 찜한 기사님 관리
      - 지정 견적 요청

      ### ❤️ 찜하기 API (Favorites)
      - 기사님 찜하기 추가/제거
      - 찜하기 상태 확인

      ### 📢 알림 API (Notification)
      - 실시간 SSE 알림 구독
      - 알림 목록 조회 및 읽음 처리
      - 전체 알림 읽음 처리

      ### ⭐ 리뷰 API (Review)
      - 이사 완료 후 리뷰 작성
      - 리뷰 작성 가능한 견적 요청 조회
      - 내가 쓴/받은 리뷰 목록

      ### 📊 고객 견적 API (UserQuote)
      - 진행중/완료된 견적 요청 조회
      - 견적 상세 정보 확인
      - 견적 확정 및 지정 견적 요청

      ## 공통 기능

      ### 주소 처리
      - 프론트엔드에서 전송하는 zonecode는 자동으로 postalCode로 변환
      - roadAddress에서 지역명, 시/군/구, 동/읍/면을 자동 추출
      - 지역명은 영어 enum으로 변환 (예: "부산" → "BUSAN")
      - API 응답에서는 지역명이 한글로 표시 (예: "BUSAN" → "부산")

      ### 데이터 처리
      - 주소 수정 시 기존 주소는 soft delete되고 새 주소가 생성
      - 견적 요청 취소 시 관련 데이터들이 soft delete
      - deletedAt 필드에는 날짜만 기록 (시간 제외)

      ### 권한 관리
      - **일반 고객**: 견적 요청 생성/조회/수정/취소, 기사님 조회, 찜하기, 리뷰 작성
      - **기사님**: 견적 제출, 고객 견적 요청 조회, 프로필 관리
      - **관리자**: 모든 기능 접근 가능

      ### 에러 처리
      - 일관된 에러 응답 형식
      - 적절한 HTTP 상태 코드 사용
      - 명확한 에러 메시지 제공

      ### 보안
      - JWT 토큰 기반 인증
      - CORS 설정으로 허용된 도메인만 접근
      - 입력값 검증 및 sanitization
      `,
    contact: {
      name: "API Support",
      email: "support@moving.com",
    },
    license: {
      name: "FS6기 1팀 ",
      url: "https://github.com/WooGie911/Moving_BE",
    },
  },
  servers: [
    {
      url: "http://localhost:5050",
      description: "Development server",
    },
    {
      url: "https://api.moving.com",
      description: "Production server",
    },
  ],
  security: {
    BearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "JWT 토큰을 Bearer 형식으로 전송",
    },
  },
  baseDir: __dirname + "/../", // src 디렉토리
  // 스캔할 파일들 - 절대 경로로 수정
  filesPattern: [
    __dirname + "/../routes/**/*.ts",
    __dirname + "/../routes/**/*.js",
    __dirname + "/../controllers/**/*.ts",
    __dirname + "/../controllers/**/*.js",
    __dirname + "/../app.ts",
    __dirname + "/../app.js",
  ],
  // Swagger UI 설정
  swaggerUIPath: "/api-docs",
  // API 기본 경로
  baseURL: process.env.BASE_URL,
  // 추가 옵션
  exposeSwaggerUI: true,
  exposeApiDocs: true,
  apiDocsPath: "/api-docs.json",
  // 태그 정의
  tags: [
    {
      name: "EstimateRequest",
      description: "견적 요청 관련 API - 고객이 이사 견적을 요청하고 관리하는 API",
    },
    {
      name: "Auth",
      description: "인증 관련 API - 회원가입, 로그인, 소셜 로그인, 토큰 관리",
    },
    {
      name: "User",
      description: "사용자 관련 API - 사용자 정보 조회, 프로필 관리, 이미지 업로드",
    },
    {
      name: "Mover",
      description: "기사님 관련 API - 기사님 목록 조회, 상세 정보, 지정 견적 요청",
    },
    {
      name: "MoverEstimate",
      description: "견적 제출 관련 API - 기사님이 고객에게 견적을 제출하고 관리하는 API",
    },
    {
      name: "Favorites",
      description: "찜하기 관련 API - 기사님 찜하기 추가/제거, 상태 확인",
    },
    {
      name: "Notification",
      description: "알림 관련 API - 실시간 SSE 알림, 알림 목록 조회 및 읽음 처리",
    },
    {
      name: "Review",
      description: "리뷰 관련 API - 이사 완료 후 리뷰 작성, 리뷰 목록 조회",
    },
    {
      name: "UserQuote",
      description: "고객 견적 관련 API - 진행중/완료된 견적 요청 조회, 견적 확정",
    },
    {
      name: "Health",
      description: "서버 상태 확인 API - 서버 상태 및 헬스 체크",
    },
  ],
  // 외부 문서 링크
  externalDocs: {
    description: "협업 노션",
    url: "https://www.notion.so/Part4-Team1-Moving-2155da6dc98c80fa89c2f08319b1ef83",
  },
};

export const setupAutoSwagger = (app: Express) => {
  return expressJSDocSwagger(app)(swaggerOptions);
};

export default swaggerOptions;

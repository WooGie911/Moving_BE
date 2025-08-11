// 테스트 환경 설정
process.env.DATABASE_URL =
  "postgresql://postgres:anqld123!@localhost:5432/moving_test";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_for_testing_only";

console.log("Test environment setup completed");
console.log("Database URL:", process.env.DATABASE_URL);

// TypeScript 모듈로 만들기 위한 빈 export
export {};

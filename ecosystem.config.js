module.exports = {
  apps: [
    {
      name: "moving-be", // 앱 이름
      script: "dist/server.js", // 실행할 파일 경로
      instances: 1, // 단일 인스턴스로 실행
      exec_mode: "fork", // fork 모드로 실행
      watch: false, // 파일 변경 감지 비활성화 (프로덕션에서는 비활성화가 좋음)
      env_production: {
        NODE_ENV: "production", // 운영 환경 설정
      },
    },
  ],
};

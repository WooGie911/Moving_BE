import app from "./app";
import { initializeScheduler } from "./utils/scheduler";

const PORT = process.env.PORT || 5050;

// 테스트 환경에서는 서버/스케줄러를 구동하지 않음
if (process.env.NODE_ENV !== "test") {
  initializeScheduler();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`서버가 실행되었습니다. 포트번호 ${PORT} 에서 실행중입니다.`);
  });
}

export const TIME = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
} as const;

export const TOKEN_EXPIRES = {
  // 토큰 만료 시간
  ACCESS_TOKEN: "10m", // 10분
  REFRESH_TOKEN: "2w", // 2주

  // 쿠키 만료 시간
  ACCESS_TOKEN_COOKIE: 10 * TIME.MINUTE, //  10분
  REFRESH_TOKEN_COOKIE: 2 * TIME.WEEK, //  2주
} as const;

export const REFRESH_TOKEN_REISSUE_THRESHOLD_SECONDS = 60 * 60 * 24 * 5;

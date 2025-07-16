export const TIME = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
} as const;

export const TOKEN_EXPIRES = {
  ACCESS_TOKEN: "2w", // 2주 , 테스트용
  REFRESH_TOKEN: "2w", // 2주
  ACCESS_TOKEN_COOKIE: 2 * TIME.WEEK, // 1209600초 (2주)
  REFRESH_TOKEN_COOKIE: 2 * TIME.WEEK, // 1209600초 (2주)
} as const;

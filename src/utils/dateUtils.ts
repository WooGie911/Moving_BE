/**
 * 한국 시간(KST) 기준으로 오늘 날짜의 시작(00:00:00)을 반환합니다.
 * @returns 한국 시간 기준 오늘 날짜의 시작
 */
export const getKoreaToday = (): Date => {
  const today = new Date();
  // 한국 시간(KST) 기준으로 오늘 날짜 계산
  const koreaTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  koreaTime.setHours(0, 0, 0, 0);
  return koreaTime;
};

/**
 * 주어진 날짜가 한국 시간 기준 오늘보다 이전인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 오늘보다 이전이면 true, 아니면 false
 */
export const isBeforeKoreaToday = (date: Date): boolean => {
  const koreaToday = getKoreaToday();
  return date < koreaToday;
};

// 한국 시간대 상수
const KOREA_TIMEZONE = "Asia/Seoul";

/**
 * 한국 시간 기준으로 오늘 날짜를 가져옵니다.
 * @returns 한국 시간 기준 오늘 날짜 (시간은 00:00:00으로 설정)
 */
const getKoreaToday = (): Date => {
  const today = new Date();
  const koreaTime = new Date(today.toLocaleString("en-US", { timeZone: KOREA_TIMEZONE }));
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

/**
 * DateTime을 YYYY-MM-DD 형식의 날짜만 반환
 * @param dateTime - DateTime 객체 또는 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDateOnly = (dateTime: Date | string | null | undefined): string | null => {
  if (!dateTime) return null;

  const date = new Date(dateTime);
  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 DateTime으로 변환
 * @param dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @returns DateTime 객체
 */
export const parseDateToDateTime = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  return date;
};

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns YYYY-MM-DD 형식의 현재 날짜 문자열
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  return formatDateOnly(now)!;
};

/**
 * deletedAt 필드를 YYYY-MM-DD 형식으로 가공
 * @param deletedAt - 삭제된 날짜
 * @returns YYYY-MM-DD 형식의 날짜 문자열 또는 null
 */
export const formatDeletedAt = (deletedAt: Date | string | null | undefined): string | null => {
  return formatDateOnly(deletedAt);
};

/**
 * API 응답용 날짜 가공 함수 (deletedAt, createdAt, updatedAt 등)
 * @param date - 날짜 객체 또는 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열 또는 null
 */
export const formatDateForAPI = (date: Date | string | null | undefined): string | null => {
  return formatDateOnly(date);
};

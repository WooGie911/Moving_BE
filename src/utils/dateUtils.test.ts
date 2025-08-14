import {
  isBeforeKoreaToday,
  isKoreaToday,
  isAfterKoreaToday,
  isValidFutureDate,
  isValidMoveDate,
  validateMoveDate,
  formatDateOnly,
  parseDateToDateTime,
  getCurrentDateString,
  formatDeletedAt,
  formatDateForAPI,
} from "./dateUtils";

describe("dateUtils", () => {
  const fixedNow = new Date("2025-07-15T12:34:56Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("relative to Korea today", () => {
    it("isBeforeKoreaToday", () => {
      const d1 = new Date("2025-07-14T14:59:59Z");
      expect(isBeforeKoreaToday(d1)).toBe(true);
    });

    it("isKoreaToday", () => {
      const d2 = new Date("2025-07-15T00:00:00+09:00");
      expect(isKoreaToday(d2)).toBe(true);
    });

    it("isAfterKoreaToday", () => {
      const d3 = new Date("2025-07-14T15:00:01Z");
      expect(isAfterKoreaToday(d3)).toBe(true);
    });

    it("isValidFutureDate / isValidMoveDate", () => {
      const todayMidnightUtc = new Date("2025-07-14T15:00:00Z");
      const future = new Date("2025-07-14T15:00:01Z");
      expect(isValidFutureDate(todayMidnightUtc)).toBe(false);
      expect(isValidMoveDate(todayMidnightUtc)).toBe(false);
      expect(isValidFutureDate(future)).toBe(true);
      expect(isValidMoveDate(future)).toBe(true);
    });
  });

  describe("validateMoveDate", () => {
    it("올바르지 않은 날짜 형식", () => {
      const invalid = new Date("not-a-date");
      const r = validateMoveDate(invalid);
      expect(r.isValid).toBe(false);
      expect(r.errorMessage).toContain("올바른 날짜 형식");
    });

    it("과거 날짜", () => {
      const past = new Date("2025-07-14T14:59:59Z");
      const r = validateMoveDate(past);
      expect(r.isValid).toBe(false);
      expect(r.errorMessage).toContain("이사일은 오늘 이후");
    });

    it("당일", () => {
      const today = new Date("2025-07-14T15:00:00Z");
      const r = validateMoveDate(today);
      expect(r.isValid).toBe(false);
      expect(r.errorMessage).toContain("당일 이사는 불가능");
    });

    it("미래 날짜", () => {
      const future = new Date("2025-07-14T15:00:01Z");
      const r = validateMoveDate(future);
      expect(r.isValid).toBe(true);
    });
  });

  describe("format helpers", () => {
    it("formatDateOnly", () => {
      expect(formatDateOnly(new Date("2025-07-01T10:00:00Z"))).toBe("2025-07-01");
      expect(formatDateOnly("2025-12-31T23:59:59Z")).toBe("2025-12-31");
      expect(formatDateOnly(null)).toBeNull();
      expect(formatDateOnly("bad")).toBeNull();
    });

    it("parseDateToDateTime", () => {
      expect(parseDateToDateTime("2025-07-20")?.toISOString().startsWith("2025-07-20")).toBe(true);
      expect(parseDateToDateTime("bad")).toBeNull();
      expect(parseDateToDateTime(null as any)).toBeNull();
    });

    it("getCurrentDateString", () => {
      expect(getCurrentDateString()).toBe("2025-07-15");
    });

    it("formatDeletedAt / formatDateForAPI", () => {
      const d = new Date("2025-01-02T03:04:05Z");
      expect(formatDeletedAt(d)).toBe("2025-01-02");
      expect(formatDateForAPI(d)).toBe("2025-01-02");
      expect(formatDeletedAt(undefined)).toBeNull();
    });
  });
});

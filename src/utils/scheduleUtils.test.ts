import {
  validateScheduleInput,
  formatAddressForTranslation,
  transformToScheduleResponse,
  mapBackendMoveType,
  mapBackendStatus,
  handleScheduleError,
} from "./scheduleUtils";
import { TMoverScheduleWithDetails } from "../types/moverSchedule";

describe("scheduleUtils", () => {
  describe("validateScheduleInput", () => {
    it("유효한 입력이면 에러를 던지지 않는다", () => {
      expect(() => validateScheduleInput("m1", 2024, 12)).not.toThrow();
    });

    it("잘못된 기사 ID면 에러를 던진다", () => {
      // @ts-expect-error 의도된 잘못된 입력
      expect(() => validateScheduleInput(undefined, 2024, 1)).toThrow("잘못된 기사 ID입니다");
    });

    it("년도/월이 유효하지 않으면 에러를 던진다", () => {
      expect(() => validateScheduleInput("m1", 0, 1)).toThrow("잘못된 년도 또는 월입니다");
      expect(() => validateScheduleInput("m1", 2024, 0)).toThrow("잘못된 년도 또는 월입니다");
      expect(() => validateScheduleInput("m1", 2024, 13)).toThrow("잘못된 년도 또는 월입니다");
    });
  });

  describe("formatAddressForTranslation", () => {
    it("영문 Region을 한글로 변환하고 파츠를 공백으로 결합한다", () => {
      const formatted = formatAddressForTranslation({
        region: "SEOUL",
        city: "강남구",
        district: "역삼동",
        detail: "테헤란로 123",
      });
      expect(formatted).toBe("서울 강남구 역삼동 테헤란로 123");
    });

    it("문장 끝의 ', Korea'를 제거한다", () => {
      const formatted = formatAddressForTranslation({
        region: "GYEONGGI",
        city: "성남시",
        district: "분당구",
        detail: "대왕판교로 364, Korea",
      });
      expect(formatted).toBe("경기 성남시 분당구 대왕판교로 364");
    });

    it("'Seoul' 단어를 '서울'로 치환한다", () => {
      const formatted = formatAddressForTranslation({
        region: "SEOUL",
        city: "Seoul",
        district: "Gangnam-gu",
        detail: "Teheran-ro 123",
      });
      expect(formatted).toBe("서울 서울 Gangnam-gu Teheran-ro 123");
    });
  });

  describe("transformToScheduleResponse", () => {
    it("상세 정보를 응답 스키마로 변환한다", () => {
      const detail: TMoverScheduleWithDetails = {
        estimateId: "e1",
        estimateRequestId: "er1",
        moverId: "m1",
        moveDate: new Date("2025-07-15T12:00:00Z"),
        moveType: "HOME",
        requestStatus: "APPROVED",
        customer: {
          id: "c1",
          name: "고객A",
          customerImage: null,
          nickname: null,
        },
        fromAddress: {
          id: "a1",
          zoneCode: "",
          city: "강남구",
          district: "역삼동",
          detail: "테헤란로 123",
          region: "SEOUL",
        },
        toAddress: {
          id: "a2",
          zoneCode: "",
          city: "성남시",
          district: "분당구",
          detail: "대왕판교로 364",
          region: "GYEONGGI",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res = transformToScheduleResponse(detail);
      expect(res).toEqual({
        id: "er1",
        customerName: "고객A",
        movingType: "home",
        status: "confirmed",
        fromAddress: "서울 강남구 역삼동 테헤란로 123",
        toAddress: "경기 성남시 분당구 대왕판교로 364",
        moveDate: "2025-07-15",
      });
    });
  });

  describe("mapBackendMoveType / mapBackendStatus", () => {
    it("이사 유형과 상태를 올바르게 매핑한다", () => {
      expect(mapBackendMoveType("HOME")).toBe("home");
      expect(mapBackendMoveType("UNKNOWN" as any)).toBe("small");

      expect(mapBackendStatus("APPROVED")).toBe("confirmed");
      expect(mapBackendStatus("UNKNOWN" as any)).toBe("pending");
    });
  });

  describe("handleScheduleError", () => {
    const originalError = console.error;

    beforeEach(() => {
      // 콘솔 오염 방지
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      console.error = () => {};
    });

    afterEach(() => {
      console.error = originalError;
    });

    it("Error 인스턴스면 원본 에러를 그대로 던진다", () => {
      const err = new Error("boom");
      expect(() => handleScheduleError(err, "기본 메시지")).toThrow(err);
    });

    it("그 외 입력이면 기본 메시지로 에러를 던진다", () => {
      expect(() => handleScheduleError("oops" as any, "기본 메시지")).toThrow("기본 메시지");
    });
  });
});

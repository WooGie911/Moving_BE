import { parseAddress, convertRegionToKorean } from "./addressUtils";

describe("addressUtils", () => {
  it("convertRegionToKorean - 영문 지역명을 한글로 변환", () => {
    expect(convertRegionToKorean("SEOUL")).toBe("서울");
    expect(convertRegionToKorean("GYEONGGI")).toBe("경기");
    expect(convertRegionToKorean("UNKNOWN")).toBe("UNKNOWN");
  });

  describe("parseAddress", () => {
    it("특별시/광역시 주소 파싱 (동 포함)", () => {
      const res = parseAddress({
        roadAddress: "서울 강남구 역삼동 테헤란로 123",
        zoneCode: "06236",
      });
      expect(res).toEqual({
        zoneCode: "06236",
        region: "SEOUL",
        city: "강남구",
        district: "역삼동",
        detail: "테헤란로 123",
      });
    });

    it("특별시/광역시 주소 파싱 (동 없음)", () => {
      const res = parseAddress({
        roadAddress: "서울 강남구 테헤란로 123",
        zoneCode: "06236",
      });
      expect(res).toEqual({
        zoneCode: "06236",
        region: "SEOUL",
        city: "강남구",
        district: "",
        detail: "테헤란로 123",
      });
    });

    it("특별자치도 주소 파싱 (동 포함)", () => {
      const res = parseAddress({
        roadAddress: "전북특별자치도 군산시 나운동 하나운안1길 40",
        zonecode: "00000",
      });
      expect(res).toEqual({
        zoneCode: "00000",
        region: "JEONBUK",
        city: "군산시",
        district: "나운동",
        detail: "하나운안1길 40",
      });
    });

    it("일반 시/군 주소 파싱 (구 포함)", () => {
      const res = parseAddress({
        roadAddress: "경기 성남시 분당구 대왕판교로 364",
        zoneCode: "13561",
      });
      expect(res).toEqual({
        zoneCode: "13561",
        region: "GYEONGGI",
        city: "성남시",
        district: "분당구",
        detail: "대왕판교로 364",
      });
    });

    it("형식 오류 시 에러", () => {
      expect(() => parseAddress({ roadAddress: "서울", zoneCode: "" })).toThrow("올바른 주소 형식이 아닙니다.");
    });
  });
});

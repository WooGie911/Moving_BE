import {
  validateCreateEstimateRequest,
  validateUpdateEstimateRequest,
  isStatusModifiable,
  isStatusCancellable,
} from "./estimateRequestUtils";

describe("EstimateRequestUtils", () => {
  describe("validateCreateEstimateRequest", () => {
    it("should return valid result for correct data", () => {
      const data = {
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
        description: "Test request",
      };

      const result = validateCreateEstimateRequest(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid result for invalid moving type", () => {
      const data = {
        movingType: "invalid",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
      };

      const result = validateCreateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("이사 종류는 small, home, office 중 하나여야 합니다.");
    });

    it("should return invalid result for missing departure address", () => {
      const data = {
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
      };

      const result = validateCreateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("출발지 주소는 필수입니다.");
    });

    it("should return invalid result for missing arrival address", () => {
      const data = {
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "",
          detailAddress: "789호",
          zoneCode: "13561",
        },
      };

      const result = validateCreateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("도착지 주소는 필수입니다.");
    });

    it("should return invalid result for same addresses", () => {
      const data = {
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
      };

      const result = validateCreateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("출발지와 도착지는 달라야 합니다.");
    });

    it("should return invalid result for past date", () => {
      const data = {
        movingType: "home",
        movingDate: "2023-01-01",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
      };

      const result = validateCreateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("이사일은 오늘 이후로 설정해주세요.");
    });

    it("should return invalid result for invalid date format", () => {
      const data = {
        movingType: "home",
        movingDate: "invalid-date",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
      };

      const result = validateCreateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("올바른 날짜 형식이 아닙니다. (YYYY-MM-DD 형식으로 입력해주세요)");
    });
  });

  describe("validateUpdateEstimateRequest", () => {
    it("should return valid result for correct data", () => {
      const data = {
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
          zoneCode: "13561",
        },
      };

      const result = validateUpdateEstimateRequest(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid result for invalid moving type", () => {
      const data = {
        movingType: "invalid",
        movingDate: "2025-12-31",
      };

      const result = validateUpdateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("이사 종류는 small, home, office 중 하나여야 합니다.");
    });

    it("should return valid result for partial data", () => {
      const data = {
        movingType: "home",
      };

      const result = validateUpdateEstimateRequest(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid result for past date", () => {
      const data = {
        movingType: "home",
        movingDate: "2023-01-01",
      };

      const result = validateUpdateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("이사일은 오늘 이후로 설정해주세요.");
    });

    it("should return invalid result for same addresses", () => {
      const data = {
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
        arrival: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
          zoneCode: "06123",
        },
      };

      const result = validateUpdateEstimateRequest(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("출발지와 도착지는 달라야 합니다.");
    });
  });

  describe("isStatusModifiable", () => {
    it("should return true for PENDING status", () => {
      const result = isStatusModifiable("PENDING");
      expect(result).toBe(true);
    });

    it("should return false for CANCELLED status", () => {
      const result = isStatusModifiable("CANCELLED");
      expect(result).toBe(false);
    });

    it("should return false for COMPLETED status", () => {
      const result = isStatusModifiable("COMPLETED");
      expect(result).toBe(false);
    });

    it("should return false for EXPIRED status", () => {
      const result = isStatusModifiable("EXPIRED");
      expect(result).toBe(false);
    });

    it("should return false for APPROVED status", () => {
      const result = isStatusModifiable("APPROVED");
      expect(result).toBe(false);
    });
  });

  describe("isStatusCancellable", () => {
    it("should return true for PENDING status without estimates", () => {
      const result = isStatusCancellable("PENDING", false);
      expect(result).toBe(true);
    });

    it("should return false for PENDING status with estimates", () => {
      const result = isStatusCancellable("PENDING", true);
      expect(result).toBe(false);
    });

    it("should return false for CANCELLED status", () => {
      const result = isStatusCancellable("CANCELLED", false);
      expect(result).toBe(false);
    });

    it("should return false for COMPLETED status", () => {
      const result = isStatusCancellable("COMPLETED", false);
      expect(result).toBe(false);
    });

    it("should return false for EXPIRED status", () => {
      const result = isStatusCancellable("EXPIRED", false);
      expect(result).toBe(false);
    });

    it("should return false for APPROVED status", () => {
      const result = isStatusCancellable("APPROVED", false);
      expect(result).toBe(false);
    });
  });
});

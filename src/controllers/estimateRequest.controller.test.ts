import { Request, Response } from "express";
import EstimateRequestController from "./estimateRequest.controller";
import EstimateRequestService from "../services/estimateRequest.service";

// Mock the service
jest.mock("../services/estimateRequest.service");

const mockEstimateRequestService = EstimateRequestService as jest.MockedClass<typeof EstimateRequestService>;

describe("EstimateRequestController", () => {
  let controller: EstimateRequestController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new EstimateRequestController();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("validateMoveDate", () => {
    it("should throw error for past date", () => {
      const pastDate = "2023-01-01";

      expect(() => {
        (controller as any).validateMoveDate(pastDate);
      }).toThrow("이사일은 오늘 이후로 설정해주세요.");
    });

    it("should throw error for invalid date format", () => {
      const invalidDate = "invalid-date";

      expect(() => {
        (controller as any).validateMoveDate(invalidDate);
      }).toThrow("올바른 날짜 형식이 아닙니다. (YYYY-MM-DD 형식으로 입력해주세요)");
    });

    it("should not throw error for future date", () => {
      const futureDate = "2025-12-31";

      expect(() => {
        (controller as any).validateMoveDate(futureDate);
      }).not.toThrow();
    });
  });

  describe("validateAddresses", () => {
    it("should throw error when departure and arrival addresses are the same", () => {
      const departure = {
        roadAddress: "서울 강남구 테헤란로 123",
        detailAddress: "456호",
      };
      const arrival = {
        roadAddress: "서울 강남구 테헤란로 123",
        detailAddress: "456호",
      };

      expect(() => {
        (controller as any).validateAddresses(departure, arrival);
      }).toThrow("출발지와 도착지는 달라야 합니다.");
    });

    it("should not throw error when addresses are different", () => {
      const departure = {
        roadAddress: "서울 강남구 테헤란로 123",
        detailAddress: "456호",
      };
      const arrival = {
        roadAddress: "경기 성남시 분당구 판교로 456",
        detailAddress: "789호",
      };

      expect(() => {
        (controller as any).validateAddresses(departure, arrival);
      }).not.toThrow();
    });

    it("should not throw error when addresses are different even with same road address but different detail", () => {
      const departure = {
        roadAddress: "서울 강남구 테헤란로 123",
        detailAddress: "456호",
      };
      const arrival = {
        roadAddress: "서울 강남구 테헤란로 123",
        detailAddress: "789호",
      };

      expect(() => {
        (controller as any).validateAddresses(departure, arrival);
      }).not.toThrow();
    });
  });

  describe("validateCreateEstimateRequest", () => {
    it("should return valid result for correct data", () => {
      const data = {
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
        },
      };

      const result = (controller as any).validateCreateEstimateRequest(data);
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
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
        },
      };

      const result = (controller as any).validateCreateEstimateRequest(data);
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
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
        },
      };

      const result = (controller as any).validateCreateEstimateRequest(data);
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
        },
        arrival: {
          roadAddress: "",
          detailAddress: "789호",
        },
      };

      const result = (controller as any).validateCreateEstimateRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("도착지 주소는 필수입니다.");
    });

    it("should return invalid result for past date", () => {
      const data = {
        movingType: "home",
        movingDate: "2023-01-01",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
        },
      };

      const result = (controller as any).validateCreateEstimateRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("이사일은 오늘 이후로 설정해주세요.");
    });

    it("should return invalid result for same addresses", () => {
      const data = {
        movingType: "home",
        movingDate: "2025-12-31",
        departure: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
        },
        arrival: {
          roadAddress: "서울 강남구 테헤란로 123",
          detailAddress: "456호",
        },
      };

      const result = (controller as any).validateCreateEstimateRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("출발지와 도착지는 달라야 합니다.");
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
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
        },
      };

      const result = (controller as any).validateUpdateEstimateRequest(data);
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
        },
        arrival: {
          roadAddress: "경기 성남시 분당구 판교로 456",
          detailAddress: "789호",
        },
      };

      const result = (controller as any).validateUpdateEstimateRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("이사 종류는 small, home, office 중 하나여야 합니다.");
    });

    it("should return valid result for partial data", () => {
      const data = {
        movingType: "home",
      };

      const result = (controller as any).validateUpdateEstimateRequest(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("getUserId", () => {
    it("should throw error when user is not authenticated", () => {
      mockRequest = {};

      expect(() => {
        (controller as any).getUserId(mockRequest as Request);
      }).toThrow("인증이 필요합니다.");
    });

    it("should throw error when userId is missing", () => {
      mockRequest = {
        user: {
          userId: "",
          name: "Test User",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1234567890,
          exp: 1234567890,
        },
      };

      expect(() => {
        (controller as any).getUserId(mockRequest as Request);
      }).toThrow("인증이 필요합니다.");
    });

    it("should return userId when authenticated", () => {
      const userId = "user123";
      mockRequest = {
        user: {
          userId,
          name: "Test User",
          userType: "CUSTOMER" as const,
          hasProfile: true,
          iat: 1234567890,
          exp: 1234567890,
        },
      };

      const result = (controller as any).getUserId(mockRequest as Request);
      expect(result).toBe(userId);
    });
  });

  describe("validateUser", () => {
    it("should throw error for empty userId", () => {
      expect(() => {
        (controller as any).validateUser("");
      }).toThrow("인증이 필요합니다.");
    });

    it("should throw error for null userId", () => {
      expect(() => {
        (controller as any).validateUser(null as any);
      }).toThrow("인증이 필요합니다.");
    });

    it("should throw error for undefined userId", () => {
      expect(() => {
        (controller as any).validateUser(undefined as any);
      }).toThrow("인증이 필요합니다.");
    });

    it("should not throw error for valid userId", () => {
      expect(() => {
        (controller as any).validateUser("user123");
      }).not.toThrow();
    });
  });
});

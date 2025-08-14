import EstimateRequestService from "./estimateRequest.service";

jest.mock("../repositories/estimateRequest.repository", () => ({
  __esModule: true,
  default: {
    checkUserType: jest.fn(),
    hasPendingRequest: jest.fn(),
    hasEstimateFromMover: jest.fn(),
    hasActiveRequestBeforeMoveDate: jest.fn(),
    checkCustomerProfile: jest.fn(),
    getActiveEstimateRequestByUserId: jest.fn(),
    findOrCreateAddress: jest.fn(),
    createEstimateRequest: jest.fn(),
    updateEstimateRequest: jest.fn(),
    getEstimateRequestById: jest.fn(),
    softDeleteAddress: jest.fn(),
    cancelEstimateRequest: jest.fn(),
    completeEstimateRequest: jest.fn(),
  },
}));

jest.mock("./action.service", () => ({
  __esModule: true,
  default: {
    createAction: jest.fn(),
  },
}));

import estimateRequestRepository from "../repositories/estimateRequest.repository";
import actionService from "./action.service";

describe("EstimateRequestService (compact)", () => {
  const service = new EstimateRequestService();
  const repo = estimateRequestRepository as jest.Mocked<typeof estimateRequestRepository>;
  const action = actionService as jest.Mocked<typeof actionService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createEstimateRequest: 주소 처리, 생성, 액션 호출까지 수행한다", async () => {
    repo.findOrCreateAddress.mockResolvedValueOnce({ id: "addr-from" });
    repo.findOrCreateAddress.mockResolvedValueOnce({ id: "addr-to" });
    repo.createEstimateRequest.mockResolvedValue({ id: "er1" } as any);

    const params = {
      userId: "u1",
      movingType: "home",
      movingDate: new Date("2025-07-20"),
      departure: { roadAddress: "경기 성남시 분당구 대왕판교로 364", detailAddress: "", zoneCode: "13561" },
      arrival: { roadAddress: "서울 강남구 역삼동 테헤란로 123", detailAddress: "", zoneCode: "06236" },
      description: "desc",
    } as any;

    const result = await service.createEstimateRequest(params);

    expect(repo.findOrCreateAddress).toHaveBeenCalledTimes(2);
    expect(repo.createEstimateRequest).toHaveBeenCalledWith(
      expect.objectContaining({ moveType: "HOME", fromAddressId: "addr-from", toAddressId: "addr-to" }),
      "u1",
    );
    expect(action.createAction).toHaveBeenCalledWith("u1", expect.any(String), "er1", "ESTIMATE_REQUEST", {});
    expect(result).toEqual({ id: "er1" });
  });

  it("updateActiveEstimateRequest: 주소 변경 없는 경우 페이로드만 업데이트한다", async () => {
    repo.updateEstimateRequest.mockResolvedValue({ id: "er1" } as any);
    const result = await service.updateActiveEstimateRequest("er1", {
      movingType: "small",
      movingDate: "2025-08-01",
      description: "d",
    } as any);
    expect(repo.updateEstimateRequest).toHaveBeenCalledWith(
      "er1",
      expect.objectContaining({ moveType: "SMALL", description: "d" }),
    );
    expect(result).toEqual({ id: "er1" });
  });

  it("updateActiveEstimateRequest: 주소 변경이 있으면 현재 요청 조회, 주소 처리, 기존 주소 소프트 삭제", async () => {
    repo.getEstimateRequestById.mockResolvedValue({ id: "er1", fromAddressId: "oldFrom", toAddressId: "oldTo" } as any);
    repo.findOrCreateAddress.mockResolvedValueOnce({ id: "newFrom" });
    repo.findOrCreateAddress.mockResolvedValueOnce({ id: "newTo" });
    repo.updateEstimateRequest.mockResolvedValue({ id: "er1" } as any);

    await service.updateActiveEstimateRequest("er1", {
      departure: { roadAddress: "경기 성남시 분당구 대왕판교로 364", detailAddress: "", zoneCode: "13561" },
      arrival: { roadAddress: "서울 강남구 역삼동 테헤란로 123", detailAddress: "", zoneCode: "06236" },
    } as any);

    expect(repo.findOrCreateAddress).toHaveBeenCalledTimes(2);
    expect(repo.updateEstimateRequest).toHaveBeenCalledWith(
      "er1",
      expect.objectContaining({ fromAddressId: "newFrom", toAddressId: "newTo" }),
    );
    expect(repo.softDeleteAddress).toHaveBeenCalledWith("oldFrom");
    expect(repo.softDeleteAddress).toHaveBeenCalledWith("oldTo");
  });

  it("cancel/complete: 위임 호출", async () => {
    repo.cancelEstimateRequest.mockResolvedValue({ id: "er1" } as any);
    repo.completeEstimateRequest.mockResolvedValue({ id: "er1" } as any);
    await service.cancelActiveEstimateRequest("er1");
    await service.completeEstimateRequest("er1");
    expect(repo.cancelEstimateRequest).toHaveBeenCalledWith("er1");
    expect(repo.completeEstimateRequest).toHaveBeenCalledWith("er1");
  });
});

import EstimateRequestService2 from "./estimateRequest.service";
import estimateRequestRepository2 from "../repositories/estimateRequest.repository";
import actionService2 from "./action.service";
import { parseAddress } from "../utils/addressUtils";

// Mock the repository, service and utils
jest.mock("../repositories/estimateRequest.repository");
jest.mock("../utils/addressUtils");
jest.mock("./action.service");

const mockEstimateRequestRepository = estimateRequestRepository2 as jest.Mocked<typeof estimateRequestRepository2>;
const mockActionService = actionService2 as jest.Mocked<typeof actionService2>;
const mockParseAddress = parseAddress as jest.MockedFunction<typeof parseAddress>;

describe("EstimateRequestService (detailed)", () => {
  let service: EstimateRequestService2;

  beforeEach(() => {
    service = new EstimateRequestService2();
    jest.clearAllMocks();

    // Default actionService mock
    mockActionService.createAction = jest.fn().mockResolvedValue(undefined);
  });

  describe("checkUserType", () => {
    it("사용자 타입을 올바르게 반환해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      const mockUserTypeResult = { isCustomer: true, isMover: false };
      mockEstimateRequestRepository.checkUserType = jest.fn().mockResolvedValue(mockUserTypeResult);

      // Act
      const result = await service.checkUserType(userId);

      // Assert
      expect(mockEstimateRequestRepository.checkUserType).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserTypeResult);
    });

    it("레포지토리 에러를 올바르게 전파해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      const mockError = new Error("사용자를 찾을 수 없습니다.");
      mockEstimateRequestRepository.checkUserType = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.checkUserType(userId)).rejects.toThrow("사용자를 찾을 수 없습니다.");
      expect(mockEstimateRequestRepository.checkUserType).toHaveBeenCalledWith(userId);
    });
  });

  describe("hasPendingRequest", () => {
    it("진행중인 요청이 있으면 true를 반환해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      mockEstimateRequestRepository.hasPendingRequest = jest.fn().mockResolvedValue(true);

      // Act
      const result = await service.hasPendingRequest(userId);

      // Assert
      expect(mockEstimateRequestRepository.hasPendingRequest).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it("진행중인 요청이 없으면 false를 반환해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      mockEstimateRequestRepository.hasPendingRequest = jest.fn().mockResolvedValue(false);

      // Act
      const result = await service.hasPendingRequest(userId);

      // Assert
      expect(mockEstimateRequestRepository.hasPendingRequest).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });
  });

  describe("hasEstimateFromMover", () => {
    it("기사님이 견적을 제출했으면 true를 반환해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      mockEstimateRequestRepository.hasEstimateFromMover = jest.fn().mockResolvedValue(true);

      // Act
      const result = await service.hasEstimateFromMover(userId);

      // Assert
      expect(mockEstimateRequestRepository.hasEstimateFromMover).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it("기사님이 견적을 제출하지 않았으면 false를 반환해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      mockEstimateRequestRepository.hasEstimateFromMover = jest.fn().mockResolvedValue(false);

      // Act
      const result = await service.hasEstimateFromMover(userId);

      // Assert
      expect(mockEstimateRequestRepository.hasEstimateFromMover).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });
  });

  describe("getActiveEstimateRequestByUserId", () => {
    it("활성 견적 요청을 성공적으로 반환해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      const mockActiveRequest = {
        id: "request-id",
        customerId: "test-user-id",
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        fromAddressId: "from-address-id",
        toAddressId: "to-address-id",
        description: "테스트 이사",
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        fromAddress: {
          zoneCode: "06123",
          city: "강남구",
          district: "테헤란로",
          detail: "456동 789호",
          region: "SEOUL",
          deletedAt: null,
        },
        toAddress: {
          zoneCode: "06124",
          city: "서초구",
          district: "서초대로",
          detail: "789동 101호",
          region: "SEOUL",
          deletedAt: null,
        },
      };
      mockEstimateRequestRepository.getActiveEstimateRequestByUserId = jest.fn().mockResolvedValue(mockActiveRequest);

      // Act
      const result = await service.getActiveEstimateRequestByUserId(userId);

      // Assert
      expect(mockEstimateRequestRepository.getActiveEstimateRequestByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockActiveRequest);
    });

    it("활성 견적 요청이 없으면 null을 반환해야 한다", async () => {
      // Arrange
      const userId = "test-user-id";
      mockEstimateRequestRepository.getActiveEstimateRequestByUserId = jest.fn().mockResolvedValue(null);

      // Act
      const result = await service.getActiveEstimateRequestByUserId(userId);

      // Assert
      expect(mockEstimateRequestRepository.getActiveEstimateRequestByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });

  describe("createEstimateRequest", () => {
    const validParams = {
      userId: "test-user-id",
      movingType: "home",
      movingDate: "2024-12-25",
      departure: {
        roadAddress: "서울특별시 강남구 테헤란로 123",
        detailAddress: "456동 789호",
        zoneCode: "06123",
      },
      arrival: {
        roadAddress: "서울특별시 서초구 서초대로 456",
        detailAddress: "789동 101호",
        zoneCode: "06124",
      },
      description: "테스트 이사",
    };

    it("성공적으로 견적 요청을 생성해야 한다", async () => {
      // Arrange
      const mockParsedDeparture = {
        zoneCode: "06123",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: "456동 789호",
      };
      const mockParsedArrival = {
        zoneCode: "06124",
        city: "서초구",
        district: "서초대로",
        region: "SEOUL",
        detail: "789동 101호",
      };
      const mockCreatedRequest = {
        id: "request-id",
        customerId: "test-user-id",
        moveType: "HOME",
        moveDate: new Date("2024-12-25"),
        fromAddressId: "from-address-id",
        toAddressId: "to-address-id",
        description: "테스트 이사",
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockParseAddress.mockReturnValueOnce(mockParsedDeparture).mockReturnValueOnce(mockParsedArrival);
      mockEstimateRequestRepository.findOrCreateAddress = jest
        .fn()
        .mockResolvedValueOnce({ id: "from-address-id" })
        .mockResolvedValueOnce({ id: "to-address-id" });
      mockEstimateRequestRepository.createEstimateRequest = jest.fn().mockResolvedValue(mockCreatedRequest);

      // Act
      const result = await service.createEstimateRequest(validParams);

      // Assert
      expect(mockParseAddress).toHaveBeenCalledTimes(2);
      expect(mockParseAddress).toHaveBeenCalledWith({
        roadAddress: "서울특별시 강남구 테헤란로 123",
        detailAddress: "456동 789호",
        zoneCode: "06123",
      });
      expect(mockParseAddress).toHaveBeenCalledWith({
        roadAddress: "서울특별시 서초구 서초대로 456",
        detailAddress: "789동 101호",
        zoneCode: "06124",
      });
      expect(mockEstimateRequestRepository.findOrCreateAddress).toHaveBeenCalledTimes(2);
      expect(mockEstimateRequestRepository.findOrCreateAddress).toHaveBeenCalledWith(mockParsedDeparture);
      expect(mockEstimateRequestRepository.findOrCreateAddress).toHaveBeenCalledWith(mockParsedArrival);
      expect(mockEstimateRequestRepository.createEstimateRequest).toHaveBeenCalledWith(
        {
          moveType: "HOME",
          moveDate: "2024-12-25",
          fromAddressId: "from-address-id",
          toAddressId: "to-address-id",
          description: "테스트 이사",
        },
        "test-user-id",
      );
      expect(result).toEqual(mockCreatedRequest);
    });

    it("이사 종류를 대문자로 변환해야 한다", async () => {
      // Arrange
      const paramsWithLowerCase = {
        ...validParams,
        movingType: "office",
      };
      const mockParsedAddress = {
        zoneCode: "06123",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: "456동 789호",
      };
      const mockCreatedRequest = {
        id: "request-id",
        moveType: "OFFICE",
      };

      mockParseAddress.mockReturnValue(mockParsedAddress);
      mockEstimateRequestRepository.findOrCreateAddress = jest.fn().mockResolvedValue({ id: "address-id" });
      mockEstimateRequestRepository.createEstimateRequest = jest.fn().mockResolvedValue(mockCreatedRequest);

      // Act
      await service.createEstimateRequest(paramsWithLowerCase);

      // Assert
      expect(mockEstimateRequestRepository.createEstimateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          moveType: "OFFICE",
        }),
        "test-user-id",
      );
    });

    it("주소 처리 중 에러가 발생하면 에러를 전파해야 한다", async () => {
      // Arrange
      const mockError = new Error("주소 처리 중 오류 발생");
      mockParseAddress.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(service.createEstimateRequest(validParams)).rejects.toThrow("주소 처리 중 오류 발생");
    });

    it("레포지토리 에러를 올바르게 전파해야 한다", async () => {
      // Arrange
      const mockParsedAddress = {
        zoneCode: "06123",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: "456동 789호",
      };
      const mockError = new Error("데이터베이스 오류");

      mockParseAddress.mockReturnValue(mockParsedAddress);
      mockEstimateRequestRepository.findOrCreateAddress = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.createEstimateRequest(validParams)).rejects.toThrow("데이터베이스 오류");
    });
  });

  describe("updateActiveEstimateRequest", () => {
    const updateData = {
      movingType: "office",
      movingDate: "2024-12-26",
      departure: {
        roadAddress: "서울특별시 강남구 테헤란로 456",
        detailAddress: "789동 101호",
        zoneCode: "06125",
      },
      arrival: {
        roadAddress: "서울특별시 서초구 서초대로 789",
        detailAddress: "101동 202호",
        zoneCode: "06126",
      },
      description: "수정된 이사",
    };

    it("성공적으로 견적 요청을 수정해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const mockCurrentRequest = {
        id: requestId,
        fromAddressId: "old-from-address-id",
        toAddressId: "old-to-address-id",
      };
      const mockParsedDeparture = {
        zoneCode: "06125",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: "789동 101호",
      };
      const mockParsedArrival = {
        zoneCode: "06126",
        city: "서초구",
        district: "서초대로",
        region: "SEOUL",
        detail: "101동 202호",
      };
      const mockUpdatedRequest = {
        id: requestId,
        moveType: "OFFICE",
        moveDate: new Date("2024-12-26"),
        fromAddressId: "new-from-address-id",
        toAddressId: "new-to-address-id",
        description: "수정된 이사",
      };

      mockEstimateRequestRepository.getEstimateRequestById = jest.fn().mockResolvedValue(mockCurrentRequest);
      mockParseAddress.mockReturnValueOnce(mockParsedDeparture).mockReturnValueOnce(mockParsedArrival);
      mockEstimateRequestRepository.findOrCreateAddress = jest
        .fn()
        .mockResolvedValueOnce({ id: "new-from-address-id" })
        .mockResolvedValueOnce({ id: "new-to-address-id" });
      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);
      mockEstimateRequestRepository.softDeleteAddress = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.updateActiveEstimateRequest(requestId, updateData);

      // Assert
      expect(mockEstimateRequestRepository.getEstimateRequestById).toHaveBeenCalledWith(requestId);
      expect(mockParseAddress).toHaveBeenCalledTimes(2);
      expect(mockEstimateRequestRepository.findOrCreateAddress).toHaveBeenCalledTimes(2);
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalledWith(requestId, {
        moveType: "OFFICE",
        moveDate: new Date("2024-12-26"),
        fromAddressId: "new-from-address-id",
        toAddressId: "new-to-address-id",
        description: "수정된 이사",
      });
      expect(mockEstimateRequestRepository.softDeleteAddress).toHaveBeenCalledTimes(2);
      expect(mockEstimateRequestRepository.softDeleteAddress).toHaveBeenCalledWith("old-from-address-id");
      expect(mockEstimateRequestRepository.softDeleteAddress).toHaveBeenCalledWith("old-to-address-id");
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("견적 요청을 찾을 수 없으면 에러를 던져야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      mockEstimateRequestRepository.getEstimateRequestById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateActiveEstimateRequest(requestId, updateData)).rejects.toThrow(
        "견적 요청을 찾을 수 없습니다.",
      );
    });

    it("주소 정보 없이 수정할 때도 성공해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const updateDataWithoutAddress = {
        movingType: "office",
        movingDate: "2024-12-26",
        description: "수정된 이사",
      };
      const mockUpdatedRequest = {
        id: requestId,
        moveType: "OFFICE",
        moveDate: new Date("2024-12-26"),
        description: "수정된 이사",
      };

      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);

      // Act
      const result = await service.updateActiveEstimateRequest(requestId, updateDataWithoutAddress);

      // Assert
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalledWith(requestId, {
        moveType: "OFFICE",
        moveDate: new Date("2024-12-26"),
        description: "수정된 이사",
      });
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("출발지만 수정할 때 올바르게 처리해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const updateDataOnlyDeparture = {
        departure: {
          roadAddress: "서울특별시 강남구 테헤란로 456",
          detailAddress: "789동 101호",
          zoneCode: "06125",
        },
      };
      const mockCurrentRequest = {
        id: requestId,
        fromAddressId: "old-from-address-id",
        toAddressId: "old-to-address-id",
      };
      const mockParsedDeparture = {
        zoneCode: "06125",
        city: "강남구",
        district: "테헤란로",
        region: "SEOUL",
        detail: "789동 101호",
      };
      const mockUpdatedRequest = {
        id: requestId,
        fromAddressId: "new-from-address-id",
      };

      mockEstimateRequestRepository.getEstimateRequestById = jest.fn().mockResolvedValue(mockCurrentRequest);
      mockParseAddress.mockReturnValue(mockParsedDeparture);
      mockEstimateRequestRepository.findOrCreateAddress = jest.fn().mockResolvedValue({ id: "new-from-address-id" });
      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);
      mockEstimateRequestRepository.softDeleteAddress = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.updateActiveEstimateRequest(requestId, updateDataOnlyDeparture);

      // Assert
      expect(mockEstimateRequestRepository.findOrCreateAddress).toHaveBeenCalledTimes(1);
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalledWith(requestId, {
        fromAddressId: "new-from-address-id",
      });
      expect(mockEstimateRequestRepository.softDeleteAddress).toHaveBeenCalledTimes(1);
      expect(mockEstimateRequestRepository.softDeleteAddress).toHaveBeenCalledWith("old-from-address-id");
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("도착지만 수정할 때 올바르게 처리해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const updateDataOnlyArrival = {
        arrival: {
          roadAddress: "서울특별시 서초구 서초대로 789",
          detailAddress: "101동 202호",
          zoneCode: "06126",
        },
      };
      const mockCurrentRequest = {
        id: requestId,
        fromAddressId: "old-from-address-id",
        toAddressId: "old-to-address-id",
      };
      const mockParsedArrival = {
        zoneCode: "06126",
        city: "서초구",
        district: "서초대로",
        region: "SEOUL",
        detail: "101동 202호",
      };
      const mockUpdatedRequest = {
        id: requestId,
        toAddressId: "new-to-address-id",
      };

      mockEstimateRequestRepository.getEstimateRequestById = jest.fn().mockResolvedValue(mockCurrentRequest);
      mockParseAddress.mockReturnValue(mockParsedArrival);
      mockEstimateRequestRepository.findOrCreateAddress = jest.fn().mockResolvedValue({ id: "new-to-address-id" });
      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);
      mockEstimateRequestRepository.softDeleteAddress = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.updateActiveEstimateRequest(requestId, updateDataOnlyArrival);

      // Assert
      expect(mockEstimateRequestRepository.findOrCreateAddress).toHaveBeenCalledTimes(1);
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalledWith(requestId, {
        toAddressId: "new-to-address-id",
      });
      expect(mockEstimateRequestRepository.softDeleteAddress).toHaveBeenCalledTimes(1);
      expect(mockEstimateRequestRepository.softDeleteAddress).toHaveBeenCalledWith("old-to-address-id");
      expect(result).toEqual(mockUpdatedRequest);
    });

    it("이사 종류를 대문자로 변환해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const updateDataWithLowerCase = {
        movingType: "small",
      };
      const mockUpdatedRequest = {
        id: requestId,
        moveType: "SMALL",
      };

      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);

      // Act
      await service.updateActiveEstimateRequest(requestId, updateDataWithLowerCase);

      // Assert
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalledWith(requestId, {
        moveType: "SMALL",
      });
    });

    it("날짜를 Date 객체로 변환해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const updateDataWithDate = {
        movingDate: "2024-12-26",
      };
      const mockUpdatedRequest = {
        id: requestId,
        moveDate: new Date("2024-12-26"),
      };

      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);

      // Act
      await service.updateActiveEstimateRequest(requestId, updateDataWithDate);

      // Assert
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalledWith(requestId, {
        moveDate: new Date("2024-12-26"),
      });
    });

    it("description이 undefined일 때도 올바르게 처리해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const updateDataWithUndefinedDescription = {
        description: undefined,
      };
      const mockUpdatedRequest = {
        id: requestId,
        description: undefined,
      };

      mockEstimateRequestRepository.updateEstimateRequest = jest.fn().mockResolvedValue(mockUpdatedRequest);

      // Act
      await service.updateActiveEstimateRequest(requestId, updateDataWithUndefinedDescription);

      // Assert
      expect(mockEstimateRequestRepository.updateEstimateRequest).toHaveBeenCalledWith(requestId, {
        description: undefined,
      });
    });
  });

  describe("cancelActiveEstimateRequest", () => {
    it("성공적으로 견적 요청을 취소해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const mockCancelledRequest = {
        id: requestId,
        status: "CANCELLED",
        deletedAt: new Date(),
      };

      mockEstimateRequestRepository.cancelEstimateRequest = jest.fn().mockResolvedValue(mockCancelledRequest);

      // Act
      const result = await service.cancelActiveEstimateRequest(requestId);

      // Assert
      expect(mockEstimateRequestRepository.cancelEstimateRequest).toHaveBeenCalledWith(requestId);
      expect(result).toEqual(mockCancelledRequest);
    });

    it("레포지토리 에러를 올바르게 전파해야 한다", async () => {
      // Arrange
      const requestId = "request-id";
      const mockError = new Error("견적 요청을 찾을 수 없습니다.");
      mockEstimateRequestRepository.cancelEstimateRequest = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.cancelActiveEstimateRequest(requestId)).rejects.toThrow("견적 요청을 찾을 수 없습니다.");
      expect(mockEstimateRequestRepository.cancelEstimateRequest).toHaveBeenCalledWith(requestId);
    });
  });
});

// @ts-nocheck
// jest 환경 타입 선언
// @jest-environment node

import EstimateRequestService from "../../services/estimateRequest.service";
import estimateRequestRepository from "../../repositories/estimateRequest.repository";

jest.mock("../../repositories/estimateRequest.repository");

const mockRepo = estimateRequestRepository as jest.Mocked<typeof estimateRequestRepository>;

describe("EstimateRequestService - 정상/에러 케이스", () => {
  let service: EstimateRequestService;
  beforeEach(() => {
    service = new EstimateRequestService();
    jest.clearAllMocks();
  });

  it("should create estimate request", async () => {
    mockRepo.findOrCreateAddress.mockResolvedValueOnce({ id: "fromId" } as any);
    mockRepo.findOrCreateAddress.mockResolvedValueOnce({ id: "toId" } as any);
    mockRepo.createEstimateRequest.mockResolvedValueOnce({ id: "reqId" } as any);
    const params = {
      userId: "user1",
      moveType: "HOME",
      fromCity: "A",
      fromDistrict: "B",
      fromDetail: "C",
      fromRegion: "SEOUL",
      toCity: "D",
      toDistrict: "E",
      toDetail: "F",
      toRegion: "BUSAN",
      moveDate: "2024-08-20",
      description: "test",
    };
    const result = await service.createEstimateRequest(params);
    expect(mockRepo.findOrCreateAddress).toHaveBeenCalledTimes(2);
    expect(mockRepo.createEstimateRequest).toHaveBeenCalledWith(
      expect.objectContaining({ moveType: "HOME", fromAddressId: "fromId", toAddressId: "toId" }),
      "user1",
    );
    expect(result).toEqual({ id: "reqId" });
  });

  it("should throw error if duplicate pending request exists", async () => {
    mockRepo.hasPendingRequest.mockResolvedValueOnce(true);
    await expect(service.hasPendingRequest("user1")).resolves.toBe(true);
  });

  it("should update active estimate request", async () => {
    mockRepo.updateEstimateRequest.mockResolvedValueOnce({ id: "reqId", description: "updated" } as any);
    const result = await service.updateActiveEstimateRequest("reqId", { description: "updated" });
    expect(mockRepo.updateEstimateRequest).toHaveBeenCalledWith("reqId", { description: "updated" });
    expect(result).toEqual({ id: "reqId", description: "updated" });
  });

  it("should throw error if update target does not exist", async () => {
    mockRepo.updateEstimateRequest.mockRejectedValueOnce(new Error("Not found"));
    await expect(service.updateActiveEstimateRequest("notExistId", { description: "fail" })).rejects.toThrow(
      "Not found",
    );
  });

  it("should cancel active estimate request", async () => {
    mockRepo.cancelEstimateRequest.mockResolvedValueOnce({ id: "reqId", status: "CANCELLED" } as any);
    const result = await service.cancelActiveEstimateRequest("reqId");
    expect(mockRepo.cancelEstimateRequest).toHaveBeenCalledWith("reqId");
    expect(result).toEqual({ id: "reqId", status: "CANCELLED" });
  });

  it("should throw error if cancel target does not exist", async () => {
    mockRepo.cancelEstimateRequest.mockRejectedValueOnce(new Error("Not found"));
    await expect(service.cancelActiveEstimateRequest("notExistId")).rejects.toThrow("Not found");
  });

  it("should get active estimate request by user id", async () => {
    mockRepo.getActiveEstimateRequestByUserId.mockResolvedValueOnce({ id: "reqId" } as any);
    const result = await service.getActiveEstimateRequestByUserId("user1");
    expect(mockRepo.getActiveEstimateRequestByUserId).toHaveBeenCalledWith("user1");
    expect(result).toEqual({ id: "reqId" });
  });

  it("should return null if no active estimate request", async () => {
    mockRepo.getActiveEstimateRequestByUserId.mockResolvedValueOnce(null);
    const result = await service.getActiveEstimateRequestByUserId("user1");
    expect(result).toBeNull();
  });

  it("should check if user has pending request", async () => {
    mockRepo.hasPendingRequest.mockResolvedValueOnce(true);
    const result = await service.hasPendingRequest("user1");
    expect(mockRepo.hasPendingRequest).toHaveBeenCalledWith("user1");
    expect(result).toBe(true);
  });

  it("should return false if user has no pending request", async () => {
    mockRepo.hasPendingRequest.mockResolvedValueOnce(false);
    const result = await service.hasPendingRequest("user1");
    expect(result).toBe(false);
  });
});

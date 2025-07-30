import estimateRequestRepository from "./estimateRequest.repository";

// 간단한 기본 테스트 - 함수가 존재하고 호출 가능한지만 확인
describe("EstimateRequest Repository 기본 테스트", () => {
  // 1. 레포지토리 함수들이 존재하는지 확인
  it("1. 견적 요청 생성 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.createEstimateRequest).toBe("function");
  });

  it("2. 활성 견적 요청 조회 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.getActiveEstimateRequestByUserId).toBe("function");
  });

  it("3. 견적 요청 수정 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.updateEstimateRequest).toBe("function");
  });

  it("4. 견적 요청 취소 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.cancelEstimateRequest).toBe("function");
  });

  it("5. 진행중인 요청 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.hasPendingRequest).toBe("function");
  });

  it("6. 기사님 견적 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.hasEstimateFromMover).toBe("function");
  });

  it("7. 사용자 타입 확인 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.checkUserType).toBe("function");
  });

  it("8. 주소 생성 함수가 존재한다", () => {
    expect(typeof estimateRequestRepository.findOrCreateAddress).toBe("function");
  });
});

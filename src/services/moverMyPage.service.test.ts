import * as userService from "./user.service";
import reviewService from "./review.service";
import { NotFoundError } from "../types/commonError.types";
import { MoveType, RegionType } from "../types/user.types";

// 기존 서비스들을 조합해서 마이페이지 데이터를 구성하는 함수
const getMoverMyPageData = async (userId: string) => {
  // 1. 사용자 기본 정보 조회
  const userInfo = await userService.userInfo(userId, "MOVER");
  if (!userInfo) {
    throw new NotFoundError("사용자를 찾을 수 없습니다");
  }

  // 2. 기사님 프로필 정보 조회
  const profileData = await userService.getProfileData(userId, "MOVER");
  if (!profileData) {
    throw new NotFoundError("기사님 프로필 정보를 찾을 수 없습니다");
  }

  // 3. 기사님 리뷰 정보 조회
  const reviews = await reviewService.getReceivedReviews(userId, {
    page: 1,
    pageSize: 1000,
  });

  // 4. 마이페이지 데이터 구성
  return {
    // 기본 정보
    id: userInfo.id,
    name: userInfo.name,
    email: userInfo.email,

    // 프로필 정보
    nickname: profileData.nickname,
    moverImage: (profileData as any).moverImage,
    career: (profileData as any).career,
    shortIntro: (profileData as any).shortIntro,
    detailIntro: (profileData as any).detailIntro,
    serviceTypes: (profileData as any).serviceTypes,
    currentAreas: (profileData as any).currentAreas,
    isVeteran: (profileData as any).isVeteran,

    // 통계 정보
    workedCount: (profileData as any).workedCount,
    averageRating: (profileData as any).averageRating,
    totalReviewCount: (profileData as any).totalReviewCount,
    totalFavoriteCount: (profileData as any).totalFavoriteCount,

    // 리뷰 정보
    reviews: reviews.data?.items || [],
    totalReviews: reviews.data?.total || 0,
  };
};

// 기사님 마이페이지 요약 정보 조회 함수
const getMoverMyPageSummary = async (userId: string) => {
  // 1. 사용자 기본 정보 조회
  const userInfo = await userService.userInfo(userId, "MOVER");
  if (!userInfo) {
    throw new NotFoundError("사용자를 찾을 수 없습니다");
  }

  // 2. 기사님 프로필 정보 조회
  const profileData = await userService.getProfileData(userId, "MOVER");
  if (!profileData) {
    throw new NotFoundError("기사님 프로필 정보를 찾을 수 없습니다");
  }

  return {
    id: userInfo.id,
    name: userInfo.name,
    nickname: profileData.nickname,
    moverImage: (profileData as any).moverImage,
    career: (profileData as any).career,
    shortIntro: (profileData as any).shortIntro,
    serviceTypes: (profileData as any).serviceTypes,
    currentAreas: (profileData as any).currentAreas,
    workedCount: (profileData as any).workedCount,
    averageRating: (profileData as any).averageRating,
    totalReviewCount: (profileData as any).totalReviewCount,
    totalFavoriteCount: (profileData as any).totalFavoriteCount,
  };
};

// 테스트를 위한 모킹 설정
jest.mock("./user.service");
jest.mock("./review.service");

describe("moverMyPageService.getMoverMyPageData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("기사님 마이페이지 데이터 조회 성공", async () => {
    // Setup
    const mockUserInfo = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const mockProfileData = {
      nickname: "믿을만한김기사",
      moverImage: "https://example.com/mover.jpg",
      career: 5,
      shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다",
      detailIntro: "안전하고 신속한 이사를 약속드립니다.",
      serviceTypes: ["SMALL", "HOME"] as MoveType[],
      currentAreas: ["SEOUL", "INCHEON"] as RegionType[],
      isVeteran: true,
      workedCount: 136,
      averageRating: 4.8,
      totalReviewCount: 128,
      totalFavoriteCount: 45,
    };

    const mockReviews = {
      success: true,
      message: "기사님 리뷰 목록입니다.",
      data: {
        items: [
          {
            id: "review1",
            rating: 5,
            content: "기사님이 친절하게 잘 해주셨어요!",
            status: "COMPLETED",
            createdAt: "2024-07-11T09:12:34.000Z",
            updatedAt: "2024-07-11T09:12:34.000Z",
            customer: {
              id: "customer1",
              profileImage: "https://example.com/customer1.jpg",
              nickname: "고객1",
              shortIntro: "깔끔한 이사를 원합니다",
              detailIntro: "신중하고 꼼꼼한 이사 서비스를 원하는 고객입니다.",
            },
            moveType: "SMALL",
            moveDate: "2024-07-10T00:00:00.000Z",
            description: "안전하고 신속한 이사를 원합니다",
            fromAddress: {
              id: "addr-1",
              city: "서울시 강남구",
              district: "역삼동",
              detail: "101동 202호",
              region: "SEOUL",
              zoneCode: "06123",
            },
            toAddress: {
              id: "addr-2",
              city: "경기도 고양시",
              district: "일산동구",
              detail: "301동 404호",
              region: "GYEONGGI",
              zoneCode: "10400",
            },
            estimate: {
              id: "estimate1",
              price: 500000,
              comment: "안전하게 이사해드리겠습니다",
              status: "ACCEPTED",
              isDesignated: false,
              validUntil: "2024-07-15T00:00:00.000Z",
              createdAt: "2024-07-09T10:00:00.000Z",
              updatedAt: "2024-07-09T10:00:00.000Z",
            },
            estimateRequest: {
              id: "request1",
              status: "COMPLETED",
              createdAt: "2024-07-09T10:00:00.000Z",
              updatedAt: "2024-07-09T10:00:00.000Z",
            },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 1000,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    (userService.userInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    (userService.getProfileData as jest.Mock).mockResolvedValue(
      mockProfileData
    );
    (reviewService.getReceivedReviews as jest.Mock).mockResolvedValue(
      mockReviews
    );

    // Exercise
    const result = await getMoverMyPageData("1");

    // Assertion
    expect(userService.userInfo).toHaveBeenCalledWith("1", "MOVER");
    expect(userService.getProfileData).toHaveBeenCalledWith("1", "MOVER");
    expect(reviewService.getReceivedReviews).toHaveBeenCalledWith("1", {
      page: 1,
      pageSize: 1000,
    });

    expect(result).toEqual({
      // 기본 정보
      id: "1",
      name: "김기사",
      email: "mover@test.com",

      // 프로필 정보
      nickname: "믿을만한김기사",
      moverImage: "https://example.com/mover.jpg",
      career: 5,
      shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다",
      detailIntro: "안전하고 신속한 이사를 약속드립니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL", "INCHEON"],
      isVeteran: true,

      // 통계 정보
      workedCount: 136,
      averageRating: 4.8,
      totalReviewCount: 128,
      totalFavoriteCount: 45,

      // 리뷰 정보
      reviews: mockReviews.data.items,
      totalReviews: 1,
    });
  });

  test("기사님 마이페이지 데이터 조회 실패 - 사용자 존재하지 않음 NotFoundError(404) 발생", async () => {
    // Setup
    (userService.userInfo as jest.Mock).mockResolvedValue(null);

    // Assertion
    await expect(getMoverMyPageData("1")).rejects.toThrow(NotFoundError);
    expect(userService.userInfo).toHaveBeenCalledWith("1", "MOVER");
  });

  test("기사님 마이페이지 데이터 조회 실패 - 프로필 정보 없음 NotFoundError(404) 발생", async () => {
    // Setup
    const mockUserInfo = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    (userService.userInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    (userService.getProfileData as jest.Mock).mockResolvedValue(null);

    // Assertion
    await expect(getMoverMyPageData("1")).rejects.toThrow(NotFoundError);
    expect(userService.userInfo).toHaveBeenCalledWith("1", "MOVER");
    expect(userService.getProfileData).toHaveBeenCalledWith("1", "MOVER");
  });

  test("기사님 마이페이지 데이터 조회 성공 - 리뷰가 없는 경우", async () => {
    // Setup
    const mockUserInfo = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const mockProfileData = {
      nickname: "새로운기사",
      moverImage: "https://example.com/new-mover.jpg",
      career: 1,
      shortIntro: "새로운 기사입니다",
      detailIntro: "열심히 일하겠습니다.",
      serviceTypes: ["SMALL"] as MoveType[],
      currentAreas: ["SEOUL"] as RegionType[],
      isVeteran: false,
      workedCount: 5,
      averageRating: 0,
      totalReviewCount: 0,
      totalFavoriteCount: 0,
    };

    const mockReviews = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 1000,
    };

    (userService.userInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    (userService.getProfileData as jest.Mock).mockResolvedValue(
      mockProfileData
    );
    (reviewService.getReceivedReviews as jest.Mock).mockResolvedValue(
      mockReviews
    );

    // Exercise
    const result = await getMoverMyPageData("1");

    // Assertion
    expect(result.reviews).toEqual([]);
    expect(result.totalReviews).toBe(0);
    expect(result.averageRating).toBe(0);
    expect(result.totalReviewCount).toBe(0);
  });
});

describe("moverMyPageService.getMoverMyPageSummary", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("기사님 마이페이지 요약 정보 조회 성공", async () => {
    // Setup
    const mockUserInfo = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const mockProfileData = {
      nickname: "믿을만한김기사",
      moverImage: "https://example.com/mover.jpg",
      career: 5,
      shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다",
      detailIntro: "안전하고 신속한 이사를 약속드립니다.",
      serviceTypes: ["SMALL", "HOME"] as MoveType[],
      currentAreas: ["SEOUL", "INCHEON"] as RegionType[],
      isVeteran: true,
      workedCount: 136,
      averageRating: 4.8,
      totalReviewCount: 128,
      totalFavoriteCount: 45,
    };

    (userService.userInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    (userService.getProfileData as jest.Mock).mockResolvedValue(
      mockProfileData
    );

    // Exercise
    const result = await getMoverMyPageSummary("1");

    // Assertion
    expect(userService.userInfo).toHaveBeenCalledWith("1", "MOVER");
    expect(userService.getProfileData).toHaveBeenCalledWith("1", "MOVER");

    expect(result).toEqual({
      id: "1",
      name: "김기사",
      nickname: "믿을만한김기사",
      moverImage: "https://example.com/mover.jpg",
      career: 5,
      shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL", "INCHEON"],
      workedCount: 136,
      averageRating: 4.8,
      totalReviewCount: 128,
      totalFavoriteCount: 45,
    });
  });

  test("기사님 마이페이지 요약 정보 조회 실패 - 사용자 존재하지 않음 NotFoundError(404) 발생", async () => {
    // Setup
    (userService.userInfo as jest.Mock).mockResolvedValue(null);

    // Assertion
    await expect(getMoverMyPageSummary("1")).rejects.toThrow(NotFoundError);
    expect(userService.userInfo).toHaveBeenCalledWith("1", "MOVER");
  });

  test("기사님 마이페이지 요약 정보 조회 실패 - 프로필 정보 없음 NotFoundError(404) 발생", async () => {
    // Setup
    const mockUserInfo = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    (userService.userInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    (userService.getProfileData as jest.Mock).mockResolvedValue(null);

    // Assertion
    await expect(getMoverMyPageSummary("1")).rejects.toThrow(NotFoundError);
    expect(userService.userInfo).toHaveBeenCalledWith("1", "MOVER");
    expect(userService.getProfileData).toHaveBeenCalledWith("1", "MOVER");
  });

  test("기사님 마이페이지 요약 정보 조회 성공 - 새로운 기사", async () => {
    // Setup
    const mockUserInfo = {
      id: "1",
      name: "새로운기사",
      email: "new-mover@test.com",
      userType: ["MOVER"],
    };

    const mockProfileData = {
      nickname: "새로운기사",
      moverImage: "https://example.com/new-mover.jpg",
      career: 1,
      shortIntro: "새로운 기사입니다",
      detailIntro: "열심히 일하겠습니다.",
      serviceTypes: ["SMALL"] as MoveType[],
      currentAreas: ["SEOUL"] as RegionType[],
      isVeteran: false,
      workedCount: 5,
      averageRating: 0,
      totalReviewCount: 0,
      totalFavoriteCount: 0,
    };

    (userService.userInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    (userService.getProfileData as jest.Mock).mockResolvedValue(
      mockProfileData
    );

    // Exercise
    const result = await getMoverMyPageSummary("1");

    // Assertion
    expect(result.averageRating).toBe(0);
    expect(result.totalReviewCount).toBe(0);
    expect(result.totalFavoriteCount).toBe(0);
    expect(result.career).toBe(1);
  });
});

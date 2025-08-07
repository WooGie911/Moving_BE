import userRepository from "./user.repository";
import prisma from "../db/prisma/prisma";
import { MoveType, RegionType } from "@prisma/client";
import { TCreateMoverProfile, TServiceId } from "../types/user.types";

jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe("userRepository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserById", () => {
    const userId = "user-123";

    const mockUser = {
      id: userId,
      name: "홍길동",
      email: "hong@example.com",
      encryptedPhoneNumber: "encrypted-01012345678",
      currentArea: "강남구",
      preferredServices: ["소형이사", "보관이사"],
      nickname: "이사왕",
      customerImage: "customer.jpg",
      moverImage: "mover.jpg",
      userType: ["CUSTOMER"],
      refreshToken: "refresh-token",
      provider: "LOCAL",
      isCustomer: true,
      isMover: false,
    };

    it("✅ 유저 ID로 유저 정보를 조회하고 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.getUserById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          encryptedPhoneNumber: true,
          currentArea: true,
          preferredServices: true,
          nickname: true,
          customerImage: true,
          moverImage: true,
          userType: true,
          refreshToken: true,
          provider: true,
          isCustomer: true,
          isMover: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it("❌ 유저가 존재하지 않으면 null을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getUserById(userId);

      expect(result).toBeNull();
    });

    it("❌ DB 조회 중 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(userRepository.getUserById(userId)).rejects.toThrow(
        "DB 오류"
      );
    });
  });

  describe("getUserWithPassword", () => {
    const userId = "user-456";

    const mockUser = {
      id: userId,
      name: "이비번",
      encryptedPassword: "hashed_password",
      currentArea: "서초구",
      userType: ["MOVER"],
    };

    it("✅ 유저 ID로 유저 정보(비밀번호 포함)를 조회하고 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userRepository.getUserWithPassword(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          encryptedPassword: true,
          currentArea: true,
          userType: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it("❌ 유저가 존재하지 않으면 null을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getUserWithPassword(userId);

      expect(result).toBeNull();
    });

    it("❌ DB 조회 중 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 조회 실패")
      );

      await expect(userRepository.getUserWithPassword(userId)).rejects.toThrow(
        "DB 조회 실패"
      );
    });
  });

  describe("getCustomerProfile", () => {
    const userId = "customer-123";

    const mockProfile = {
      name: "홍길동",
      nickname: "길동이",
      email: "gil@example.com",
      encryptedPhoneNumber: "encrypted-01012345678",
      customerImage: "customer.jpg",
      preferredServices: ["소형이사"],
      currentArea: "강남구",
    };

    it("✅ 일반 유저 프로필을 정상적으로 조회하고 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userRepository.getCustomerProfile(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          name: true,
          nickname: true,
          email: true,
          encryptedPhoneNumber: true,
          customerImage: true,
          preferredServices: true,
          currentArea: true,
        },
      });

      expect(result).toEqual(mockProfile);
    });

    it("❌ 유저가 존재하지 않으면 null을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getCustomerProfile(userId);

      expect(result).toBeNull();
    });

    it("❌ DB 조회 중 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(userRepository.getCustomerProfile(userId)).rejects.toThrow(
        "DB 오류"
      );
    });
  });

  describe("getMoverProfile", () => {
    const userId = "mover-123";

    const mockProfile = {
      name: "이사왕",
      nickname: "프로이사꾼",
      moverImage: "mover.jpg",
      career: 5,
      shortIntro: "빠르고 안전한 이사",
      detailIntro: "5년 경력의 전문 이사 기사입니다.",
      serviceTypes: ["보관이사", "가정이사"],
      currentAreas: ["송파구", "강동구"],
      isVeteran: true,
      workedCount: 120,
      averageRating: 4.9,
      totalReviewCount: 50,
      totalFavoriteCount: 30,
    };

    it("✅ 기사님 프로필을 정상적으로 조회하고 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userRepository.getMoverProfile(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          name: true,
          nickname: true,
          moverImage: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          serviceTypes: true,
          currentAreas: true,
          isVeteran: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          totalFavoriteCount: true,
        },
      });

      expect(result).toEqual(mockProfile);
    });

    it("❌ 유저가 존재하지 않으면 null을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getMoverProfile(userId);

      expect(result).toBeNull();
    });

    it("❌ DB 조회 중 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(userRepository.getMoverProfile(userId)).rejects.toThrow(
        "DB 오류"
      );
    });
  });

  describe("createCustomerProfile", () => {
    const mockProfileInput = {
      userId: "customer-999",
      nickname: "길동이",
      customerImage: "profile.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    const mockUpdatedUser = {
      id: "customer-999",
      name: "홍길동",
      nickname: "길동이",
      customerImage: "profile.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    it("✅ 프로필 등록 시 유저 정보를 업데이트하고 결과를 반환한다", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result =
        await userRepository.createCustomerProfile(mockProfileInput);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockProfileInput.userId },
        data: {
          customerImage: mockProfileInput.customerImage,
          currentArea: mockProfileInput.currentArea,
          preferredServices: mockProfileInput.preferredServices,
          nickname: mockProfileInput.nickname,
          isCustomer: true,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          customerImage: true,
          currentArea: true,
          preferredServices: true,
        },
      });

      expect(result).toEqual(mockUpdatedUser);
    });

    it("❌ 프로필 등록 중 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("프로필 등록 실패")
      );

      await expect(
        userRepository.createCustomerProfile(mockProfileInput)
      ).rejects.toThrow("프로필 등록 실패");
    });
  });

  describe("updateCustomerProfile", () => {
    const userId = "customer-123";
    const updateData = {
      nickname: "테스트닉네임",
      customerImage: "test-image.png",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    it("✅ 고객 프로필 정보를 정상적으로 업데이트한다", async () => {
      const mockUpdatedUser = { id: userId, ...updateData };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await userRepository.updateCustomerProfile(
        userId,
        updateData
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });

      expect(result).toEqual(mockUpdatedUser);
    });

    it("❌ DB 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error("DB 오류"));

      await expect(
        userRepository.updateCustomerProfile(userId, updateData)
      ).rejects.toThrow("DB 오류");
    });
  });

  describe("updateMoverProfile", () => {
    const userId = "mover-999";

    const updateData = {
      nickname: "이사킹",
      moverImage: "mover.jpg",
      career: 10,
      shortIntro: "친절하고 빠릅니다",
      detailIntro: "10년 경력의 전문가입니다.",
      serviceTypes: ["HOME", "OFFICE"] as MoveType[],
      currentAreas: ["SEOUL", "GYEONGGI"] as RegionType[],
      isVeteran: true,
    };

    const mockUpdatedProfile = {
      id: userId,
      name: "김기사",
      nickname: "이사킹",
      moverImage: "mover.jpg",
      career: 10,
      shortIntro: "친절하고 빠릅니다",
      detailIntro: "10년 경력의 전문가입니다.",
      serviceTypes: ["HOME", "OFFICE"],
      currentAreas: ["SEOUL", "GYEONGGI"],
      isVeteran: true,
      workedCount: 120,
      averageRating: 4.8,
      totalReviewCount: 42,
      totalFavoriteCount: 20,
    };

    it("✅ 기사님 프로필을 업데이트하고 결과를 반환한다", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const result = await userRepository.updateMoverProfile(
        userId,
        updateData
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          nickname: true,
          moverImage: true,
          career: true,
          shortIntro: true,
          detailIntro: true,
          serviceTypes: true,
          currentAreas: true,
          isVeteran: true,
          workedCount: true,
          averageRating: true,
          totalReviewCount: true,
          totalFavoriteCount: true,
        },
      });

      expect(result).toEqual(mockUpdatedProfile);
    });

    it("❌ 프로필 업데이트 중 오류가 발생하면 예외를 throw한다", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("DB 업데이트 실패")
      );

      await expect(
        userRepository.updateMoverProfile(userId, updateData)
      ).rejects.toThrow("DB 업데이트 실패");
    });
  });

  describe("createMoverProfile", () => {
    const profileData: TCreateMoverProfile = {
      userId: "user-999",
      nickname: "철수",
      moverImage: "mover.jpg",
      career: 3,
      shortIntro: "빠르고 친절해요!",
      detailIntro: "서울 전 지역 가능, 1톤 트럭 보유",
      serviceTypes: ["HOME", "OFFICE"],
      currentAreas: ["SEOUL", "GYEONGGI"] as RegionType[],
    };

    const mockReturn = {
      id: profileData.userId,
      name: null,
      ...profileData,
      isVeteran: false,
      workedCount: 0,
      averageRating: 0,
      totalReviewCount: 0,
      totalFavoriteCount: 0,
    };

    it("✅ 기사님 프로필을 생성하고 사용자 정보를 반환한다", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockReturn);

      const result = await userRepository.createMoverProfile(profileData);

      expect(result).toEqual(mockReturn);
    });

    it("❌ 프로필 생성 중 오류가 발생하면 예외를 throw한다", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error("DB 오류"));

      await expect(
        userRepository.createMoverProfile(profileData)
      ).rejects.toThrow("DB 오류");
    });
  });

  describe("checkNicknameExists", () => {
    const nickname = "이사왕";
    const excludeUserId = "user-123";

    it("✅ 해당 닉네임을 가진 유저가 존재하면 true를 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "someone-else",
        nickname,
      });

      const result = await userRepository.checkNicknameExists(nickname);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          nickname,
        },
      });

      expect(result).toBe(true);
    });

    it("✅ excludeUserId를 전달하면 해당 유저를 제외하고 검색한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "someone-else",
        nickname,
      });

      const result = await userRepository.checkNicknameExists(
        nickname,
        excludeUserId
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          nickname,
          NOT: { id: excludeUserId },
        },
      });

      expect(result).toBe(true);
    });

    it("❌ 닉네임이 존재하지 않으면 false를 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.checkNicknameExists(nickname);

      expect(result).toBe(false);
    });

    it("❌ DB 조회 중 오류가 발생하면 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(
        userRepository.checkNicknameExists(nickname)
      ).rejects.toThrow("DB 오류");
    });
  });

  describe("updateUserProfile", () => {
    const userId = "user-999";

    const baseSelect = {
      id: true,
      name: true,
      nickname: true,
      customerImage: true,
      moverImage: true,
      currentArea: true,
      preferredServices: true,
      serviceTypes: true,
      userType: true,
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    // ✅ 여기 추가
    it("✅ currentRegion이 존재할 경우 currentArea를 업데이트한다", async () => {
      const updateData = {
        currentRegion: "SEOUL" as RegionType,
      };

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        currentArea: "SEOUL",
      });

      const result = await userRepository.updateUserProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          currentArea: "SEOUL",
        },
        select: baseSelect,
      });

      expect(result).toEqual({
        id: userId,
        currentArea: "SEOUL",
      });
    });

    it("✅ currentRegion이 undefined일 경우 currentArea를 업데이트하지 않는다", async () => {
      const updateData = {
        currentRegion: undefined,
      };

      (prisma.user.update as jest.Mock).mockResolvedValue({ id: userId });

      const result = await userRepository.updateUserProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {},
        select: baseSelect,
      });

      expect(result).toEqual({ id: userId });
    });

    it("✅ 기본 정보만 업데이트 (이름, 전화번호, 비밀번호)", async () => {
      const updateData = {
        name: "홍길동",
        encryptedPhoneNumber: "encrypted-01012345678",
        encryptedPassword: "hashed_pw",
      };

      const mockUpdated = { id: userId, ...updateData };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await userRepository.updateUserProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: baseSelect,
      });

      expect(result).toEqual(mockUpdated);
    });

    it("✅ 사용자 타입이 CUSTOMER일 때 customerImage 필드 업데이트", async () => {
      const updateData = {
        profileImage: "customer.jpg",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: ["CUSTOMER"],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        customerImage: "customer.jpg",
      });

      const result = await userRepository.updateUserProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { customerImage: "customer.jpg" },
        select: baseSelect,
      });

      expect(result).toEqual({
        id: userId,
        customerImage: "customer.jpg",
      });
    });

    it("✅ 사용자 타입이 MOVER일 때 moverImage 필드 업데이트", async () => {
      const updateData = {
        profileImage: "mover.jpg",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: ["MOVER"],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        moverImage: "mover.jpg",
      });

      const result = await userRepository.updateUserProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { moverImage: "mover.jpg" },
        select: baseSelect,
      });

      expect(result).toEqual({
        id: userId,
        moverImage: "mover.jpg",
      });
    });

    it("✅ 유저 정보가 없을 경우 이미지 필드 업데이트는 무시된다", async () => {
      const updateData = {
        profileImage: "no-user.jpg",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
      });

      const result = await userRepository.updateUserProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {}, // user가 null이므로 이미지 필드 없음
        select: baseSelect,
      });

      expect(result).toEqual({
        id: userId,
      });
    });

    it("✅ serviceIds를 전달하면 userType에 따라 서비스 필드가 설정된다 (CUSTOMER)", async () => {
      const serviceIds = [1, 2] as TServiceId[]; // SMALL, HOME

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: ["CUSTOMER"],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        preferredServices: ["SMALL", "HOME"],
      });

      const result = await userRepository.updateUserProfile(
        userId,
        {},
        serviceIds
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          preferredServices: ["SMALL", "HOME"],
        },
        select: baseSelect,
      });

      expect(result).toEqual({
        id: userId,
        preferredServices: ["SMALL", "HOME"],
      });
    });

    it("✅ 서비스 타입 - CUSTOMER일 때 preferredServices 필드가 업데이트된다", async () => {
      const serviceIds = [1, 3] as TServiceId[]; // SMALL, OFFICE

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: ["CUSTOMER"],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        preferredServices: ["SMALL", "OFFICE"],
      });

      const result = await userRepository.updateUserProfile(
        userId,
        {},
        serviceIds
      );

      expect(result).toEqual({
        id: userId,
        preferredServices: ["SMALL", "OFFICE"],
      });
    });

    it("✅ 서비스 타입 - MOVER일 때 serviceTypes 필드가 업데이트된다", async () => {
      const serviceIds = [2, 3] as TServiceId[]; // HOME, OFFICE

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: ["MOVER"],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        serviceTypes: ["HOME", "OFFICE"],
      });

      const result = await userRepository.updateUserProfile(
        userId,
        {},
        serviceIds
      );

      expect(result).toEqual({
        id: userId,
        serviceTypes: ["HOME", "OFFICE"],
      });
    });

    it("✅ 유저 타입이 없을 때 서비스 필드는 업데이트되지 않는다", async () => {
      const serviceIds = [1] as TServiceId[]; // SMALL

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: [],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
      });

      const result = await userRepository.updateUserProfile(
        userId,
        {},
        serviceIds
      );

      expect(result).toEqual({
        id: userId,
      });
    });

    it("✅ 알 수 없는 serviceId가 들어올 경우 fallback으로 SMALL 처리된다", async () => {
      const serviceIds = [999] as unknown as TServiceId[];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: ["CUSTOMER"],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        preferredServices: ["SMALL"],
      });

      const result = await userRepository.updateUserProfile(
        userId,
        {},
        serviceIds
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { preferredServices: ["SMALL"] },
        select: baseSelect,
      });

      expect(result).toEqual({
        id: userId,
        preferredServices: ["SMALL"],
      });
    });

    it("✅ serviceIds를 전달하면 userType에 따라 서비스 필드가 설정된다 (MOVER)", async () => {
      const serviceIds = [2, 3] as TServiceId[]; // HOME, OFFICE

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        userType: ["MOVER"],
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        serviceTypes: ["HOME", "OFFICE"],
      });

      const result = await userRepository.updateUserProfile(
        userId,
        {},
        serviceIds
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          serviceTypes: ["HOME", "OFFICE"],
        },
        select: baseSelect,
      });

      expect(result).toEqual({
        id: userId,
        serviceTypes: ["HOME", "OFFICE"],
      });
    });

    it("❌ 업데이트 중 오류가 발생하면 예외를 throw한다", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("업데이트 실패")
      );

      await expect(
        userRepository.updateUserProfile(userId, { name: "에러" })
      ).rejects.toThrow("업데이트 실패");
    });
  });

  describe("getUserNameById", () => {
    const userId = "user-777";

    it("✅ 유저가 존재하면 이름을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        name: "홍길동",
      });

      const result = await userRepository.getUserNameById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { name: true },
      });

      expect(result).toBe("홍길동");
    });

    it("❌ 유저가 존재하지 않으면 빈 문자열을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getUserNameById(userId);

      expect(result).toBe("");
    });

    it("❌ DB 조회 중 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(userRepository.getUserNameById(userId)).rejects.toThrow(
        "DB 오류"
      );
    });
  });

  describe("getMoverInfoById", () => {
    const moverId = "mover-888";

    const mockMover = {
      id: moverId,
      name: "이사왕",
      nickname: "프로이사꾼",
    };

    it("✅ 무버 정보가 존재하면 name, nickname을 포함한 정보를 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockMover);

      const result = await userRepository.getMoverInfoById(moverId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: moverId },
        select: {
          id: true,
          name: true,
          nickname: true,
        },
      });

      expect(result).toEqual(mockMover);
    });

    it("❌ 무버 정보가 존재하지 않으면 null을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userRepository.getMoverInfoById(moverId);

      expect(result).toBeNull();
    });

    it("❌ DB 조회 중 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(userRepository.getMoverInfoById(moverId)).rejects.toThrow(
        "DB 오류"
      );
    });
  });
});

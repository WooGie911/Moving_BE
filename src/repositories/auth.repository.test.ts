// auth.repository.test.ts
import authRepository from "./auth.repository";
import prisma from "../db/prisma/prisma";
import { TUserRole } from "../types/user.types";
import { AuthProvider } from "@prisma/client";

jest.mock("../db/prisma/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("authRepository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("✅ 유저 생성 시 DB에 저장된 유저 정보를 반환한다", async () => {
      const mockUserInput = {
        email: "test@example.com",
        name: "홍길동",
        encryptedPassword: "hashed_pw",
        encryptedPhoneNumber: "encrypted_phone",
        userType: "CUSTOMER" as TUserRole,
      };

      const mockCreatedUser = {
        id: "1",
        name: "홍길동",
        userType: ["CUSTOMER"],
        nickname: null,
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await authRepository.createUser(mockUserInput);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockUserInput.email,
          name: mockUserInput.name,
          encryptedPassword: mockUserInput.encryptedPassword,
          encryptedPhoneNumber: mockUserInput.encryptedPhoneNumber,
          userType: [mockUserInput.userType],
        },
        select: {
          id: true,
          name: true,
          userType: true,
          nickname: true,
        },
      });

      expect(result).toEqual(mockCreatedUser);
    });

    it("❌ 유저 생성 시 오류가 발생하면 오류를 반환한다", async () => {
      const mockUserInput = {
        email: "test@example.com",
        name: "홍길동",
        encryptedPassword: "hashed_pw",
        encryptedPhoneNumber: "encrypted_phone",
        userType: "CUSTOMER" as TUserRole,
      };

      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error("유저 생성 오류")
      );

      await expect(authRepository.createUser(mockUserInput)).rejects.toThrow(
        "유저 생성 오류"
      );
    });
  });

  describe("createSocialUser", () => {
    const mockUserInput = {
      email: "social@example.com",
      name: "김소셜",
      userType: "MOVER" as TUserRole,
      provider: AuthProvider.GOOGLE, // ✅ 여기를 수정
      providerId: "google-12345",
    };

    const mockCreatedUser = {
      id: "2",
      name: "김소셜",
      userType: ["MOVER"],
      nickname: null,
      provider: AuthProvider.GOOGLE,
    };

    it("✅ 소셜 유저 생성 시 DB에 저장된 유저 정보를 반환한다", async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await authRepository.createSocialUser(mockUserInput);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockUserInput.email,
          name: mockUserInput.name,
          userType: [mockUserInput.userType],
          provider: mockUserInput.provider,
          providerId: mockUserInput.providerId,
        },
        select: {
          id: true,
          name: true,
          userType: true,
          nickname: true,
          provider: true,
        },
      });

      expect(result).toEqual(mockCreatedUser);
    });

    it("❌ 소셜 유저 생성 시 오류가 발생하면 오류를 반환한다", async () => {
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error("소셜 유저 생성 오류")
      );

      await expect(
        authRepository.createSocialUser(mockUserInput)
      ).rejects.toThrow("소셜 유저 생성 오류");
    });
  });

  describe("findUserByEmailAndPassword", () => {
    const mockEmail = "login@example.com";

    const mockUser = {
      id: "3",
      name: "로그인유저",
      userType: ["CUSTOMER"],
      email: mockEmail,
      encryptedPassword: "hashed_pw",
      customerImage: "customer.jpg",
      moverImage: "mover.jpg",
      isCustomer: true,
      isMover: false,
      provider: AuthProvider.LOCAL,
    };

    it("✅ 이메일로 유저를 조회하면 유저 정보를 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authRepository.findUserByEmailAndPassword(mockEmail);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
        select: {
          id: true,
          name: true,
          userType: true,
          email: true,
          encryptedPassword: true,
          customerImage: true,
          moverImage: true,
          isCustomer: true,
          isMover: true,
          provider: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it("❌ 조회 결과가 없을 경우 null을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authRepository.findUserByEmailAndPassword(mockEmail);

      expect(result).toBeNull();
    });

    it("❌ DB 조회 중 에러 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(
        authRepository.findUserByEmailAndPassword(mockEmail)
      ).rejects.toThrow("DB 오류");
    });
  });

  describe("findUserByEmail", () => {
    const mockEmail = "test@example.com";

    const mockUser = {
      id: "10",
      email: mockEmail,
      name: "홍길동",
      userType: ["CUSTOMER"],
      encryptedPassword: "hashed_pw",
      refreshToken: null,
      provider: AuthProvider.LOCAL,
    };

    it("✅ 이메일로 유저를 조회하면 유저 정보를 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authRepository.findUserByEmail(mockEmail);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });

      expect(result).toEqual(mockUser);
    });

    it("❌ 해당 이메일의 유저가 없으면 null을 반환한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authRepository.findUserByEmail(mockEmail);

      expect(result).toBeNull();
    });

    it("❌ DB 오류 발생 시 예외를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 오류")
      );

      await expect(authRepository.findUserByEmail(mockEmail)).rejects.toThrow(
        "DB 오류"
      );
    });
  });

  describe("updateUserToken", () => {
    const userId = "123";
    const refreshToken = "new-refresh-token";
    const userType: TUserRole[] = ["CUSTOMER"];

    const mockUpdatedUser = {
      id: userId,
      refreshToken,
      userType,
    };

    it("✅ refreshToken과 userType을 모두 업데이트한다", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await authRepository.updateUserToken(
        userId,
        refreshToken,
        userType
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken, userType },
      });

      expect(result).toEqual(mockUpdatedUser);
    });

    it("✅ userType이 없이 refreshToken만 업데이트할 수 있다", async () => {
      const mockOnlyRefresh = {
        id: userId,
        refreshToken,
        userType: undefined,
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockOnlyRefresh);

      const result = await authRepository.updateUserToken(userId, refreshToken);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken, userType: undefined },
      });

      expect(result).toEqual(mockOnlyRefresh);
    });

    it("❌ DB 업데이트 실패 시 에러를 throw한다", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("DB 업데이트 오류")
      );

      await expect(
        authRepository.updateUserToken(userId, refreshToken, userType)
      ).rejects.toThrow("DB 업데이트 오류");
    });
  });

  describe("findUserById", () => {
    const userId = "user-123";

    const mockUser = {
      id: userId,
      email: "test@example.com",
      name: "홍길동",
      userType: ["CUSTOMER"],
    };

    it("✅ 유저 ID로 유저 정보를 조회한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authRepository.findUserById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(result).toEqual(mockUser);
    });

    it("❌ DB 조회 중 오류 발생 시 에러를 throw한다", async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB 조회 실패")
      );

      await expect(authRepository.findUserById(userId)).rejects.toThrow(
        "DB 조회 실패"
      );
    });
  });

  describe("updateUser", () => {
    const userId = "user-456";
    const provider = "GOOGLE" as AuthProvider;
    const providerId = "google-123";
    const userType = ["CUSTOMER"] as TUserRole[];

    const baseSelect = {
      id: true,
      name: true,
      userType: true,
      nickname: true,
      provider: true,
      isCustomer: true,
      isMover: true,
    };

    const mockUpdatedUser = {
      id: userId,
      name: "홍길동",
      userType,
      nickname: null,
      provider,
      isCustomer: true,
      isMover: false,
    };

    it("✅ name이 있을 경우 유저 정보를 업데이트한다", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await authRepository.updateUser(
        userId,
        provider,
        providerId,
        userType,
        "홍길동"
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          provider,
          providerId,
          userType,
          name: "홍길동",
        },
        select: baseSelect,
      });

      expect(result).toEqual(mockUpdatedUser);
    });

    it("✅ name이 없는 경우 유저 정보를 업데이트한다", async () => {
      const updatedUserWithoutName = { ...mockUpdatedUser, name: undefined };

      (prisma.user.update as jest.Mock).mockResolvedValue(
        updatedUserWithoutName
      );

      const result = await authRepository.updateUser(
        userId,
        provider,
        providerId,
        userType
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          provider,
          providerId,
          userType,
        },
        select: baseSelect,
      });

      expect(result).toEqual(updatedUserWithoutName);
    });

    it("❌ 업데이트 중 에러 발생 시 예외를 throw한다", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("업데이트 실패")
      );

      await expect(
        authRepository.updateUser(
          userId,
          provider,
          providerId,
          userType,
          "홍길동"
        )
      ).rejects.toThrow("업데이트 실패");
    });
  });
});

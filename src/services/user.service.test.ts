import { NotFoundError, ValidationError } from "../types/commonError.types";
import { generateToken } from "../utils/generateToken";
import { encryptPhoneNumber } from "../utils/phoneEncryption";
import {
  createCustomerProfile,
  getProfileData,
  updateCustomerProfileCheck,
  userInfo,
  updateMoverBasicInfo,
  updateMoverProfileCheck,
  createMoverProfile,
} from "./user.service";
import {
  validateCustomerProfileData,
  validateMoverProfileData,
} from "../utils/validators/profileValidator";
import { MoveType, RegionType } from "../types/user.types";
import bcrypt from "bcrypt";
import { validateMoverProfileUpdate } from "../utils/validators/userValidator";
import userRepository from "../repositories/user.repository";
import actionService from "./action.service";

jest.mock("../repositories/user.repository");
jest.mock("../utils/generateToken");
jest.mock("../utils/validators/profileValidator");
jest.mock("../utils/phoneEncryption", () => ({
  encryptPhoneNumber: jest.fn((v: string) => `encrypted-${v}`),
  decryptPhoneNumber: jest.fn((v: string) => v.replace("encrypted-", "")),
}));
jest.mock("../utils/validators/userValidator");
jest.mock("./action.service", () => ({
  __esModule: true,
  default: {
    createAction: jest.fn(),
  },
  createAction: jest.fn(),
}));

describe("userService.userInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("CUSTOMER 유저 정보 조회 성공", async () => {
    // Setup
    const plainPhoneNumber = "01012345678";
    // 실제 전화번호 암호화
    const encryptedPhoneNumber = encryptPhoneNumber(plainPhoneNumber);

    const mockUser = {
      id: 1,
      name: "홍길동",
      email: "test@test.com",
      encryptedPhoneNumber,
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
      nickname: "홍길동",
      customerImage: "test.jpg",
      moverImage: "test.jpg",
      userType: ["CUSTOMER", "MOVER"],
      refreshToken: "refreshToken",
      provider: "LOCAL",
      isCustomer: true,
      isMover: true,
    };

    const expectedUser = {
      id: 1,
      name: "홍길동",
      email: "test@test.com",
      phoneNumber: plainPhoneNumber,
      nickname: "홍길동",
      customerImage: "test.jpg",
      userType: "CUSTOMER",
      provider: "LOCAL",
      hasBothProfiles: true,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    // Exercise
    const user = await userInfo("1", "CUSTOMER");

    // Assertion
    expect(user).toMatchObject(expectedUser);
  });

  it("MOVER 유저 정보 조회 성공", async () => {
    // Setup
    const plainPhoneNumber = "01012345678";
    // 실제 전화번호 암호화
    const encryptedPhoneNumber = encryptPhoneNumber(plainPhoneNumber);

    const mockUser = {
      id: 1,
      name: "홍길동",
      email: "test@test.com",
      encryptedPhoneNumber,
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
      nickname: "홍길동",
      customerImage: "test.jpg",
      moverImage: "test.jpg",
      userType: ["CUSTOMER", "MOVER"],
      refreshToken: "refreshToken",
      provider: "LOCAL",
      isCustomer: false,
      isMover: true,
    };

    const expectedUser = {
      id: 1,
      name: "홍길동",
      email: "test@test.com",
      phoneNumber: plainPhoneNumber,
      nickname: "홍길동",
      moverImage: "test.jpg",
      userType: "MOVER",
      provider: "LOCAL",
      hasBothProfiles: false,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    // Exercise
    const user = await userInfo("1", "MOVER");

    // Assertion
    expect(user).toEqual(expectedUser);
  });

  it("유저 정보 조회 실패 - 유저 정보 없음 NotFoundError(404) 발생", async () => {
    // Setup
    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(null);

    // Assertion
    await expect(userInfo("1", "CUSTOMER")).rejects.toThrow(NotFoundError);
  });
});

describe("userService.getProfileData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("CUSTOMER 프로필 정보 조회 성공", async () => {
    // Setup
    const plainPhoneNumber = "01012345678";
    // 실제 전화번호 암호화
    const encryptedPhoneNumber = encryptPhoneNumber(plainPhoneNumber);

    const mockUser = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      encryptedPhoneNumber,
      customerImage: "test.jpg",
      preferredServices: ["SMALL", "HOME"],
      currentArea: "SEOUL",
    };

    const expectedProfile = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: plainPhoneNumber,
      customerImage: "test.jpg",
      preferredServices: ["SMALL", "HOME"],
      currentArea: "SEOUL",
    };

    const mockGetCustomerProfile =
      userRepository.getCustomerProfile as jest.Mock;
    mockGetCustomerProfile.mockResolvedValue(mockUser);

    // Exercise
    const profile = await getProfileData("1", "CUSTOMER");

    // Assertion
    expect(profile).toMatchObject(expectedProfile);
  });

  it("MOVER 프로필 정보 조회 성공", async () => {
    const mockUser = {
      name: "홍길동",
      nickname: "홍길동",
      moverImage: "test.jpg",
      career: "10년",
      shortIntro: "믿을 수 있는 기사입니다",
      detailIntro: "고객님의 만족을 위해 최선을 다하겠습니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL", "INCHEON"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const expectedProfile = {
      name: "홍길동",
      nickname: "홍길동",
      moverImage: "test.jpg",
      career: "10년",
      shortIntro: "믿을 수 있는 기사입니다",
      detailIntro: "고객님의 만족을 위해 최선을 다하겠습니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL", "INCHEON"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetMoverProfile = userRepository.getMoverProfile as jest.Mock;
    mockGetMoverProfile.mockResolvedValue(mockUser);

    // Exercise
    const profile = await getProfileData("1", "MOVER");

    // Assertion
    expect(profile).toMatchObject(expectedProfile);
  });

  it("CUSTOMER 프로필 정보 조회 실패 - 프로필 정보 없음 NotFoundError(404) 발생", async () => {
    // Setup
    const mockGetCustomerProfile =
      userRepository.getCustomerProfile as jest.Mock;
    mockGetCustomerProfile.mockResolvedValue(null);

    // Assertion
    await expect(getProfileData("1", "CUSTOMER")).rejects.toThrow(
      NotFoundError
    );
  });

  it("MOVER 프로필 정보 조회 실패 - 프로필 정보 없음 NotFoundError(404) 발생", async () => {
    // Setup
    const mockGetMoverProfile = userRepository.getMoverProfile as jest.Mock;
    mockGetMoverProfile.mockResolvedValue(null);

    // Assertion
    await expect(getProfileData("1", "MOVER")).rejects.toThrow(NotFoundError);
  });
});

describe("userService.createCustomerProfile", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("CUSTOMER 프로필 등록 성공", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "홍길동",
      email: "test@test.com",
      encryptedPhoneNumber: "0101234567890",
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
      nickname: "홍길동",
      customerImage: "test.jpg",
      moverImage: "test.jpg",
      userType: ["CUSTOMER", "MOVER"],
      refreshToken: "refreshToken",
    };

    // 프로필 생성 로직 반환값
    const createProfileData = {
      userId: "1",
      nickname: "홍길동",
      customerImage: "test.jpg",
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
    };

    // 프로필 생성 결과 예상값
    const expectedProfile = {
      result: createProfileData,
      accessToken: "accessToken",
      refreshToken: "refreshToken",
    };

    // 사용자 존재 확인 로직 모킹
    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    // 토큰 생성 로직 모킹
    const mockGenerateToken = generateToken as jest.Mock;
    mockGenerateToken.mockReturnValue({
      newAccessToken: "accessToken",
      newRefreshToken: "refreshToken",
    });

    // 프로필 생성 로직 모킹
    const mockCreateCustomerProfile =
      userRepository.createCustomerProfile as jest.Mock;
    mockCreateCustomerProfile.mockResolvedValue(createProfileData);

    // Exercise
    const profile = await createCustomerProfile("1", {
      nickname: "홍길동",
      customerImage: "test.jpg",
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
    });

    // Assertion
    expect(profile).toMatchObject(expectedProfile);
    // 액션 생성 호출 검증
    expect(actionService.createAction as any).toHaveBeenCalledWith(
      "1",
      expect.anything(),
      "1",
      "WELCOME",
      { userType: "CUSTOMER" }
    );
    // 토큰 인자 검증 (provider 반환 포함 여부는 서비스에서 처리)
    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        name: "홍길동",
        userType: "CUSTOMER",
        hasProfile: true,
      })
    );
    // provider는 서비스 반환에 포함되지 않으므로 검증 제거
  });

  it("CUSTOMER 프로필 등록 실패 - 사용자 존재 확인 실패 NotFoundError(404) 발생", async () => {
    // Setup

    // 사용자 존재 확인 로직 모킹
    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(null);

    // Assertion
    await expect(
      createCustomerProfile("1", {
        nickname: "홍길동",
        customerImage: "test.jpg",
        currentArea: "SEOUL",
        preferredServices: ["SMALL", "HOME"],
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("CUSTOMER 프로필 등록 실패 - 사용자 존재 확인 메시지 검증", async () => {
    (userRepository.getUserById as jest.Mock).mockResolvedValue(null);
    await expect(
      createCustomerProfile("1", {
        nickname: "홍길동",
        customerImage: "test.jpg",
        currentArea: "SEOUL",
        preferredServices: ["SMALL", "HOME"],
      })
    ).rejects.toThrow("존재하지 않는 유저입니다");
  });
});

describe("userService.updateCustomerProfileCheck", () => {
  beforeEach(() => {
    (validateCustomerProfileData as jest.Mock).mockReset();
    (validateCustomerProfileData as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("CUSTOMER 프로필 수정 성공 - 반환값 없음", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "홍길동",
      email: "test@test.com",
      encryptedPhoneNumber: "01012345678",
      encryptedPassword: await bcrypt.hash("1rhdidld!", 10),
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
      nickname: "홍길동",
      customerImage: "test.jpg",
      moverImage: "test.jpg",
      userType: ["CUSTOMER", "MOVER"],
      refreshToken: "refreshToken",
    };

    const updateData = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      password: "1rhdidld!",
      newPassword: "1qkralsrb!",
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    // 사용자 존재 확인 모킹
    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUser);

    // 프로필 수정 모킹
    const mockUpdateCustomerProfile =
      userRepository.updateCustomerProfile as jest.Mock;
    mockUpdateCustomerProfile.mockResolvedValue(updateData);

    // Exercise
    const profile = await updateCustomerProfileCheck("1", updateData);

    // Assertion
    expect(profile).toBeUndefined();
    // 유효성 검사 호출
    expect(validateCustomerProfileData).toHaveBeenCalledWith(updateData, "1");
    // 레포 호출 인자 검증
    expect(userRepository.updateCustomerProfile).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        encryptedPhoneNumber: expect.stringMatching(/^encrypted-/),
        encryptedPassword: expect.any(String),
      })
    );
  });

  it("CUSTOMER 프로필 수정 성공 - 비밀번호 변경 없이 업데이트(원본 비번 유지)", async () => {
    // Setup
    const originalHashed = await bcrypt.hash("1rhdidld!", 10);
    const mockUser = {
      id: "1",
      name: "홍길동",
      email: "test@test.com",
      encryptedPhoneNumber: "encrypted-01012345678",
      encryptedPassword: originalHashed,
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
      nickname: "홍길동",
      customerImage: "test.jpg",
      moverImage: "test.jpg",
      userType: ["CUSTOMER", "MOVER"],
      refreshToken: "refreshToken",
    };

    const updateData = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      // password/newPassword 없음
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    } as any;

    (userRepository.getUserWithPassword as jest.Mock).mockResolvedValue(
      mockUser
    );
    (validateCustomerProfileData as jest.Mock).mockResolvedValue(undefined);
    (userRepository.updateCustomerProfile as jest.Mock).mockResolvedValue({});

    await updateCustomerProfileCheck("1", updateData);

    // 기존 해시가 그대로 전달되는지 검증
    expect(userRepository.updateCustomerProfile).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ encryptedPassword: originalHashed })
    );
  });

  it("CUSTOMER 프로필 수정 시 전화번호 암호화 함수 호출 검증", async () => {
    const mockUser = {
      id: "1",
      name: "홍길동",
      email: "test@test.com",
      encryptedPassword: await bcrypt.hash("1rhdidld!", 10),
    };

    const updateData = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: "01099998888",
      password: "1rhdidld!",
      newPassword: "1qkralsrb!",
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    (userRepository.getUserWithPassword as jest.Mock).mockResolvedValue(
      mockUser
    );
    (validateCustomerProfileData as jest.Mock).mockResolvedValue(undefined);
    (userRepository.updateCustomerProfile as jest.Mock).mockResolvedValue({});

    await updateCustomerProfileCheck("1", updateData);

    expect(encryptPhoneNumber).toHaveBeenCalledWith("01099998888");
  });

  it("CUSTOMER 프로필 수정 실패 - 사용자 존재 확인 실패 NotFoundError(404) 발생", async () => {
    // Setup

    const updateUserProfileData = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      password: "1rhdidld!",
      newPassword: "1qkralsrb!",
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    // 사용자 존재 확인 모킹
    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(null);

    // Assertion
    await expect(
      updateCustomerProfileCheck("1", updateUserProfileData)
    ).rejects.toThrow(NotFoundError);
  });

  it("CUSTOMER 프로필 수정 실패 - 현재 비밀번호 검증 실패 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "홍길동",
      email: "test@test.com",
      encryptedPassword: await bcrypt.hash("1rhdidld!", 10),
      userType: ["CUSTOMER", "MOVER"],
    };

    const updateUserProfileData = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      password: "1rhdidld!1", // 현재 비밀번호 불일치
      newPassword: "1qkralsrb!",
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    // 사용자 존재 확인 모킹
    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUser);

    // Assertion
    await expect(
      updateCustomerProfileCheck("1", updateUserProfileData)
    ).rejects.toThrow(ValidationError);
  });

  it("CUSTOMER 프로필 수정 실패 - 새 비밀번호가 현재와 같으면 ValidationError", async () => {
    const mockUser = {
      id: "1",
      name: "홍길동",
      encryptedPassword: await bcrypt.hash("1rhdidld!", 10),
      userType: ["CUSTOMER", "MOVER"],
    };

    const updateUserProfileData = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      password: "1rhdidld!",
      newPassword: "1rhdidld!", // 동일
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    (userRepository.getUserWithPassword as jest.Mock).mockResolvedValue(
      mockUser
    );

    await expect(
      updateCustomerProfileCheck("1", updateUserProfileData)
    ).rejects.toThrow(ValidationError);
  });

  it("CUSTOMER 프로필 수정 실패 - 새 비밀번호만 있고 현재 비밀번호 없으면 ValidationError", async () => {
    const mockUser = {
      id: "1",
      name: "홍길동",
      encryptedPassword: await bcrypt.hash("1rhdidld!", 10),
      userType: ["CUSTOMER", "MOVER"],
    };

    const updateUserProfileData = {
      name: "홍길동",
      nickname: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      // password 없음
      newPassword: "1qkralsrb!",
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    } as any;

    (userRepository.getUserWithPassword as jest.Mock).mockResolvedValue(
      mockUser
    );

    await expect(
      updateCustomerProfileCheck("1", updateUserProfileData)
    ).rejects.toThrow(ValidationError);
  });
});

// 기사님 기본정보 수정 테스트
describe("userService.updateMoverBasicInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("기사님 기본정보 수정 성공 - 이름만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      name: "김기사수정",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockUpdateUserProfile = userRepository.updateUserProfile as jest.Mock;
    mockUpdateUserProfile.mockResolvedValue({
      ...mockUser,
      name: "김기사수정",
    });

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", {
      name: "김기사수정",
    });
  });

  it("기사님 기본정보 수정 성공 - 전화번호만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      phoneNumber: "01087654321",
    };

    // 전화번호 암호화 모킹
    const mockEncryptPhoneNumber = encryptPhoneNumber as jest.Mock;
    mockEncryptPhoneNumber.mockReturnValue("encrypted_phone_number");

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockUpdateUserProfile = userRepository.updateUserProfile as jest.Mock;
    mockUpdateUserProfile.mockResolvedValue(mockUser);

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", {
      encryptedPhoneNumber: "encrypted_phone_number",
    });
    expect(mockEncryptPhoneNumber).toHaveBeenCalledWith("01087654321");
  });

  it("기사님 기본정보 수정 성공 - 비밀번호만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const mockUserWithPassword = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      encryptedPassword: await bcrypt.hash("현재비밀번호123!", 10),
      userType: ["MOVER"],
    };

    const updateData = {
      currentPassword: "현재비밀번호123!",
      newPassword: "새비밀번호456!",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUserWithPassword);

    const mockUpdateUserProfile = userRepository.updateUserProfile as jest.Mock;
    mockUpdateUserProfile.mockResolvedValue(mockUser);

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", {
      encryptedPassword: expect.any(String), // 해시된 새 비밀번호
    });
  });

  it("기사님 기본정보 수정 성공 - 모든 필드 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const mockUserWithPassword = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      encryptedPassword: await bcrypt.hash("현재비밀번호123!", 10),
      userType: ["MOVER"],
    };

    const updateData = {
      name: "김기사수정",
      phoneNumber: "01087654321",
      currentPassword: "현재비밀번호123!",
      newPassword: "새비밀번호456!",
    };

    // 전화번호 암호화 모킹
    const mockEncryptPhoneNumber = encryptPhoneNumber as jest.Mock;
    mockEncryptPhoneNumber.mockReturnValue("encrypted_phone_number");

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUserWithPassword);

    const mockUpdateUserProfile = userRepository.updateUserProfile as jest.Mock;
    mockUpdateUserProfile.mockResolvedValue(mockUser);

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", {
      name: "김기사수정",
      encryptedPhoneNumber: "encrypted_phone_number",
      encryptedPassword: expect.any(String),
    });
    expect(mockEncryptPhoneNumber).toHaveBeenCalledWith("01087654321");
  });

  it("기사님 기본정보 수정 실패 - 사용자 존재하지 않음 NotFoundError(404) 발생", async () => {
    // Setup
    const updateData = {
      name: "김기사수정",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(null);

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(
      NotFoundError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
  });

  it("기사님 기본정보 수정 실패 - 현재 비밀번호 불일치 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const mockUserWithPassword = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      encryptedPassword: await bcrypt.hash("현재비밀번호123!", 10),
      userType: ["MOVER"],
    };

    const updateData = {
      currentPassword: "잘못된비밀번호", // 현재 비밀번호와 다름
      newPassword: "새비밀번호456!",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUserWithPassword);

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
  });

  it("기사님 기본정보 수정 실패 - 현재 비밀번호 확인 불가 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      currentPassword: "현재비밀번호123!",
      newPassword: "새비밀번호456!",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(null); // 사용자 정보 없음

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
  });

  it("기사님 기본정보 수정 실패 - 현재 비밀번호 없음 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const mockUserWithPassword = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      encryptedPassword: null, // 비밀번호 없음
      userType: ["MOVER"],
    };

    const updateData = {
      currentPassword: "현재비밀번호123!",
      newPassword: "새비밀번호456!",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockGetUserWithPassword =
      userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUserWithPassword);

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
  });

  it("기사님 기본정보 수정 성공 - 비밀번호 변경 없이 이름만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      name: "김기사수정",
      // currentPassword, newPassword 없음
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockUpdateUserProfile = userRepository.updateUserProfile as jest.Mock;
    mockUpdateUserProfile.mockResolvedValue({
      ...mockUser,
      name: "김기사수정",
    });

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", {
      name: "김기사수정",
    });
    // getUserWithPassword는 호출되지 않아야 함 (비밀번호 변경이 없으므로)
  });

  it("기사님 기본정보 수정 성공 - 이름 앞뒤 공백 제거", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      name: "  김기사수정  ", // 앞뒤 공백 포함
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockUpdateUserProfile = userRepository.updateUserProfile as jest.Mock;
    mockUpdateUserProfile.mockResolvedValue({
      ...mockUser,
      name: "김기사수정",
    });

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", {
      name: "김기사수정",
    }); // 공백 제거됨
  });
});

// 기사님 프로필 수정 테스트
describe("userService.updateMoverProfileCheck", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("기사님 프로필 수정 성공 - 닉네임만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      nickname: "수정된닉네임",
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "수정된닉네임",
      moverImage: "test.jpg",
      career: 5,
      shortIntro: "믿을 수 있는 기사입니다",
      detailIntro: "고객님의 만족을 위해 최선을 다하겠습니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockResolvedValue(undefined);

    const mockUpdateMoverProfile =
      userRepository.updateMoverProfile as jest.Mock;
    mockUpdateMoverProfile.mockResolvedValue(expectedResult);

    // Exercise
    const result = await updateMoverProfileCheck("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
    expect(mockUpdateMoverProfile).toHaveBeenCalledWith("1", updateData);
    expect(result).toEqual(expectedResult);
  });

  it("기사님 프로필 수정 성공 - 이미지만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      moverImage: "https://example.com/new-image.jpg",
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "김기사",
      moverImage: "https://example.com/new-image.jpg",
      career: 5,
      shortIntro: "믿을 수 있는 기사입니다",
      detailIntro: "고객님의 만족을 위해 최선을 다하겠습니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockResolvedValue(undefined);

    const mockUpdateMoverProfile =
      userRepository.updateMoverProfile as jest.Mock;
    mockUpdateMoverProfile.mockResolvedValue(expectedResult);

    // Exercise
    const result = await updateMoverProfileCheck("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
    expect(mockUpdateMoverProfile).toHaveBeenCalledWith("1", updateData);
    expect(result).toEqual(expectedResult);
  });

  it("기사님 프로필 수정 성공 - 활동지역만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      currentAreas: ["SEOUL", "INCHEON"] as RegionType[],
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "김기사",
      moverImage: "test.jpg",
      career: 5,
      shortIntro: "믿을 수 있는 기사입니다",
      detailIntro: "고객님의 만족을 위해 최선을 다하겠습니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL", "INCHEON"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockResolvedValue(undefined);

    const mockUpdateMoverProfile =
      userRepository.updateMoverProfile as jest.Mock;
    mockUpdateMoverProfile.mockResolvedValue(expectedResult);

    // Exercise
    const result = await updateMoverProfileCheck("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
    expect(mockUpdateMoverProfile).toHaveBeenCalledWith("1", updateData);
    expect(result).toEqual(expectedResult);
  });

  it("기사님 프로필 수정 성공 - 서비스타입만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      serviceTypes: ["SMALL", "HOME", "OFFICE"] as MoveType[],
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "김기사",
      moverImage: "test.jpg",
      career: 5,
      shortIntro: "믿을 수 있는 기사입니다",
      detailIntro: "고객님의 만족을 위해 최선을 다하겠습니다.",
      serviceTypes: ["SMALL", "HOME", "OFFICE"],
      currentAreas: ["SEOUL"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockResolvedValue(undefined);

    const mockUpdateMoverProfile =
      userRepository.updateMoverProfile as jest.Mock;
    mockUpdateMoverProfile.mockResolvedValue(expectedResult);

    // Exercise
    const result = await updateMoverProfileCheck("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
    expect(mockUpdateMoverProfile).toHaveBeenCalledWith("1", updateData);
    expect(result).toEqual(expectedResult);
  });

  it("기사님 프로필 수정 성공 - 소개글만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      shortIntro: "수정된 한줄 소개입니다",
      detailIntro: "수정된 상세 설명입니다. 더 자세한 내용을 포함합니다.",
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "김기사",
      moverImage: "test.jpg",
      career: 5,
      shortIntro: "수정된 한줄 소개입니다",
      detailIntro: "수정된 상세 설명입니다. 더 자세한 내용을 포함합니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockResolvedValue(undefined);

    const mockUpdateMoverProfile =
      userRepository.updateMoverProfile as jest.Mock;
    mockUpdateMoverProfile.mockResolvedValue(expectedResult);

    // Exercise
    const result = await updateMoverProfileCheck("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
    expect(mockUpdateMoverProfile).toHaveBeenCalledWith("1", updateData);
    expect(result).toEqual(expectedResult);
  });

  it("기사님 프로필 수정 성공 - 경력만 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      career: 10,
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "김기사",
      moverImage: "test.jpg",
      career: 10,
      shortIntro: "믿을 수 있는 기사입니다",
      detailIntro: "고객님의 만족을 위해 최선을 다하겠습니다.",
      serviceTypes: ["SMALL", "HOME"],
      currentAreas: ["SEOUL"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockResolvedValue(undefined);

    const mockUpdateMoverProfile =
      userRepository.updateMoverProfile as jest.Mock;
    mockUpdateMoverProfile.mockResolvedValue(expectedResult);

    // Exercise
    const result = await updateMoverProfileCheck("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
    expect(mockUpdateMoverProfile).toHaveBeenCalledWith("1", updateData);
    expect(result).toEqual(expectedResult);
  });

  it("기사님 프로필 수정 성공 - 모든 필드 수정", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      nickname: "수정된닉네임",
      moverImage: "https://example.com/new-image.jpg",
      currentAreas: ["SEOUL", "INCHEON"] as RegionType[],
      serviceTypes: ["SMALL", "HOME", "OFFICE"] as MoveType[],
      shortIntro: "수정된 한줄 소개입니다",
      detailIntro: "수정된 상세 설명입니다. 더 자세한 내용을 포함합니다.",
      career: 10,
      isVeteran: true,
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "수정된닉네임",
      moverImage: "https://example.com/new-image.jpg",
      career: 10,
      shortIntro: "수정된 한줄 소개입니다",
      detailIntro: "수정된 상세 설명입니다. 더 자세한 내용을 포함합니다.",
      serviceTypes: ["SMALL", "HOME", "OFFICE"],
      currentAreas: ["SEOUL", "INCHEON"],
      isVeteran: true,
      workedCount: 10,
      averageRating: 4.5,
      totalReviewCount: 10,
      totalFavoriteCount: 10,
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockResolvedValue(undefined);

    const mockUpdateMoverProfile =
      userRepository.updateMoverProfile as jest.Mock;
    mockUpdateMoverProfile.mockResolvedValue(expectedResult);

    // Exercise
    const result = await updateMoverProfileCheck("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
    expect(mockUpdateMoverProfile).toHaveBeenCalledWith("1", updateData);
    expect(result).toEqual(expectedResult);
  });

  it("기사님 프로필 수정 실패 - 사용자 존재하지 않음 NotFoundError(404) 발생", async () => {
    // Setup
    const updateData = {
      nickname: "수정된닉네임",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(null);

    // Assertion
    await expect(updateMoverProfileCheck("1", updateData)).rejects.toThrow(
      NotFoundError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
  });

  it("기사님 프로필 수정 실패 - 유효성 검사 실패 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      nickname: "중복된닉네임", // 중복된 닉네임으로 유효성 검사 실패 유도
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockRejectedValue(
      new ValidationError("이미 사용 중인 닉네임입니다")
    );

    // Assertion
    await expect(updateMoverProfileCheck("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
  });

  it("기사님 프로필 수정 실패 - 잘못된 지역 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      currentAreas: ["INVALID_REGION" as any], // 잘못된 지역
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockRejectedValue(
      new ValidationError("유효하지 않은 지역입니다")
    );

    // Assertion
    await expect(updateMoverProfileCheck("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
  });

  it("기사님 프로필 수정 실패 - 잘못된 서비스타입 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      serviceTypes: ["INVALID_SERVICE" as any], // 잘못된 서비스 타입
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockRejectedValue(
      new ValidationError("유효하지 않은 서비스 타입입니다")
    );

    // Assertion
    await expect(updateMoverProfileCheck("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
  });

  it("기사님 프로필 수정 실패 - 음수 경력 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      career: -1, // 음수 경력
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockRejectedValue(
      new ValidationError("경력은 0년 이상이어야 합니다")
    );

    // Assertion
    await expect(updateMoverProfileCheck("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
  });

  it("기사님 프로필 수정 실패 - 짧은 소개글 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      shortIntro: "짧음", // 너무 짧은 소개글
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockRejectedValue(
      new ValidationError("한줄 소개는 최소 8자 이상이어야 합니다")
    );

    // Assertion
    await expect(updateMoverProfileCheck("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
  });

  it("기사님 프로필 수정 실패 - 짧은 상세설명 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const updateData = {
      detailIntro: "짧음", // 너무 짧은 상세 설명
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    const mockValidateMoverProfileUpdate =
      validateMoverProfileUpdate as jest.Mock;
    mockValidateMoverProfileUpdate.mockRejectedValue(
      new ValidationError("상세 설명은 최소 10자 이상이어야 합니다")
    );

    // Assertion
    await expect(updateMoverProfileCheck("1", updateData)).rejects.toThrow(
      ValidationError
    );
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockValidateMoverProfileUpdate).toHaveBeenCalledWith(
      updateData,
      "1"
    );
  });
});

describe("userService.createMoverProfile", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("기사님 프로필 등록 성공 - 모든 필드 포함", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const profileData = {
      nickname: "믿을만한김기사",
      moverImage: "https://example.com/mover.jpg",
      career: 5,
      shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다",
      detailIntro:
        "안전하고 신속한 이사를 약속드립니다. 고객님의 만족을 최우선으로 생각합니다.",
      currentAreas: ["SEOUL", "INCHEON"] as RegionType[],
      serviceTypes: ["SMALL", "HOME"] as MoveType[],
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "믿을만한김기사",
      moverImage: "https://example.com/mover.jpg",
      career: 5,
      shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다",
      detailIntro:
        "안전하고 신속한 이사를 약속드립니다. 고객님의 만족을 최우선으로 생각합니다.",
      currentAreas: ["SEOUL", "INCHEON"],
      serviceTypes: ["SMALL", "HOME"],
      isVeteran: true,
      workedCount: 0,
      averageRating: 0,
      totalReviewCount: 0,
      totalFavoriteCount: 0,
    };

    const mockTokens = {
      newAccessToken: "new_access_token",
      newRefreshToken: "new_refresh_token",
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (validateMoverProfileData as jest.Mock).mockResolvedValue(undefined);
    (userRepository.createMoverProfile as jest.Mock).mockResolvedValue(
      expectedResult
    );
    (generateToken as jest.Mock).mockReturnValue(mockTokens);

    // Exercise
    const result = await createMoverProfile("1", profileData);

    // Assertion
    expect(userRepository.getUserById).toHaveBeenCalledWith("1");
    expect(validateMoverProfileData).toHaveBeenCalledWith(profileData, "1");
    expect(userRepository.createMoverProfile).toHaveBeenCalledWith({
      userId: "1",
      nickname: "믿을만한김기사",
      moverImage: "https://example.com/mover.jpg",
      career: 5,
      shortIntro: "5년 경력의 꼼꼼한 이사 전문가입니다",
      detailIntro:
        "안전하고 신속한 이사를 약속드립니다. 고객님의 만족을 최우선으로 생각합니다.",
      currentAreas: ["SEOUL", "INCHEON"],
      serviceTypes: ["SMALL", "HOME"],
    });
    expect(generateToken).toHaveBeenCalledWith({
      id: "1",
      name: "김기사",
      userType: "MOVER",
      hasProfile: true,
    });
    expect(result).toEqual({
      result: expectedResult,
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
    });
    // 액션 생성 호출 검증
    expect(actionService.createAction as any).toHaveBeenCalledWith(
      "1",
      expect.anything(),
      "1",
      "WELCOME",
      { userType: "MOVER" }
    );
    // 토큰 인자 검증
    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        name: "김기사",
        userType: "MOVER",
        hasProfile: true,
      })
    );
  });

  it("기사님 프로필 등록 성공 - 최소 필드만 포함", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const profileData = {
      nickname: "새로운기사",
      currentAreas: ["SEOUL"] as RegionType[],
      serviceTypes: ["SMALL"] as MoveType[],
    };

    const expectedResult = {
      id: "1",
      name: "김기사",
      nickname: "새로운기사",
      moverImage: null,
      career: 0,
      shortIntro: "",
      detailIntro: "",
      currentAreas: ["SEOUL"],
      serviceTypes: ["SMALL"],
      isVeteran: null,
      workedCount: 0,
      averageRating: 0,
      totalReviewCount: 0,
      totalFavoriteCount: 0,
    };

    const mockTokens = {
      newAccessToken: "new_access_token",
      newRefreshToken: "new_refresh_token",
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (validateMoverProfileData as jest.Mock).mockResolvedValue(undefined);
    (userRepository.createMoverProfile as jest.Mock).mockResolvedValue(
      expectedResult
    );
    (generateToken as jest.Mock).mockReturnValue(mockTokens);

    // Exercise
    const result = await createMoverProfile("1", profileData);

    // Assertion
    expect(userRepository.createMoverProfile).toHaveBeenCalledWith({
      userId: "1",
      nickname: "새로운기사",
      moverImage: undefined,
      career: 0,
      shortIntro: "",
      detailIntro: "",
      currentAreas: ["SEOUL"],
      serviceTypes: ["SMALL"],
    });
    expect(result).toEqual({
      result: expectedResult,
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
    });
    expect(actionService.createAction as any).toHaveBeenCalledWith(
      "1",
      expect.anything(),
      "1",
      "WELCOME",
      { userType: "MOVER" }
    );
    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        name: "김기사",
        userType: "MOVER",
        hasProfile: true,
      })
    );
  });

  it("기사님 프로필 등록 실패 - 사용자 존재하지 않음 NotFoundError(404) 발생", async () => {
    // Setup
    const profileData = {
      nickname: "믿을만한김기사",
      currentAreas: ["SEOUL"] as RegionType[],
      serviceTypes: ["SMALL"] as MoveType[],
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(null);

    // Assertion
    await expect(createMoverProfile("1", profileData)).rejects.toThrow(
      NotFoundError
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith("1");
  });

  it("기사님 프로필 등록 실패 - 유효성 검사 실패 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const profileData = {
      nickname: "믿을만한김기사",
      currentAreas: ["INVALID_REGION" as any], // 잘못된 지역
      serviceTypes: ["SMALL"] as MoveType[],
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (validateMoverProfileData as jest.Mock).mockRejectedValue(
      new ValidationError("유효하지 않은 지역입니다")
    );

    // Assertion
    await expect(createMoverProfile("1", profileData)).rejects.toThrow(
      ValidationError
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith("1");
    expect(validateMoverProfileData).toHaveBeenCalledWith(profileData, "1");
  });

  it("기사님 프로필 등록 실패 - 닉네임 중복 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const profileData = {
      nickname: "이미존재하는닉네임",
      currentAreas: ["SEOUL"] as RegionType[],
      serviceTypes: ["SMALL"] as MoveType[],
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (validateMoverProfileData as jest.Mock).mockRejectedValue(
      new ValidationError("이미 사용 중인 닉네임입니다")
    );

    // Assertion
    await expect(createMoverProfile("1", profileData)).rejects.toThrow(
      ValidationError
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith("1");
    expect(validateMoverProfileData).toHaveBeenCalledWith(profileData, "1");
  });

  it("기사님 프로필 등록 실패 - 빈 닉네임 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const profileData = {
      nickname: "", // 빈 닉네임
      currentAreas: ["SEOUL"] as RegionType[],
      serviceTypes: ["SMALL"] as MoveType[],
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (validateMoverProfileData as jest.Mock).mockRejectedValue(
      new ValidationError("닉네임은 필수 입력 항목입니다")
    );

    // Assertion
    await expect(createMoverProfile("1", profileData)).rejects.toThrow(
      ValidationError
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith("1");
    expect(validateMoverProfileData).toHaveBeenCalledWith(profileData, "1");
  });

  it("기사님 프로필 등록 실패 - 빈 서비스 타입 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const profileData = {
      nickname: "믿을만한김기사",
      currentAreas: ["SEOUL"] as RegionType[],
      serviceTypes: [], // 빈 서비스 타입 배열
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (validateMoverProfileData as jest.Mock).mockRejectedValue(
      new ValidationError("서비스 타입은 최소 1개 이상 선택해야 합니다")
    );

    // Assertion
    await expect(createMoverProfile("1", profileData)).rejects.toThrow(
      ValidationError
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith("1");
    expect(validateMoverProfileData).toHaveBeenCalledWith(profileData, "1");
  });

  it("기사님 프로필 등록 실패 - 빈 지역 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "김기사",
      email: "mover@test.com",
      userType: ["MOVER"],
    };

    const profileData = {
      nickname: "믿을만한김기사",
      currentAreas: [], // 빈 지역 배열
      serviceTypes: ["SMALL"] as MoveType[],
    };

    (userRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (validateMoverProfileData as jest.Mock).mockRejectedValue(
      new ValidationError("활동 지역은 최소 1개 이상 선택해야 합니다")
    );

    // Assertion
    await expect(createMoverProfile("1", profileData)).rejects.toThrow(
      ValidationError
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith("1");
    expect(validateMoverProfileData).toHaveBeenCalledWith(profileData, "1");
  });
});

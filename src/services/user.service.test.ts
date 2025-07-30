import * as userRepository from "../repositories/user.repository";
import { NotFoundError, ValidationError } from "../types/commonError.types";
import { generateToken } from "../utils/generateToken";
import { encryptPhoneNumber } from "../utils/phoneEncryption";
import {
  createCustomerProfile,
  getProfileData,
  updateCustomerProfileCheck,
  userInfo,
  updateMoverBasicInfo,
} from "./user.service";
import { validateCustomerProfileData } from "../utils/validators/profileValidator";
import { MoveType, RegionType } from "../types/user.types";
import bcrypt from "bcrypt";

jest.mock("../repositories/user.repository");
jest.mock("../utils/generateToken");
jest.mock("../utils/validators/profileValidator");
jest.mock("../utils/phoneEncryption");

describe("userService.userInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("CUSTOMER 유저 정보 조회 성공", async () => {
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
    };

    const expectedUser = {
      id: 1,
      name: "홍길동",
      email: "test@test.com",
      phoneNumber: plainPhoneNumber,
      nickname: "홍길동",
      customerImage: "test.jpg",
      userType: "CUSTOMER",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    // Exercise
    const user = await userInfo("1", "CUSTOMER");

    // Assertion
    expect(user).toEqual(expectedUser);
  });

  test("MOVER 유저 정보 조회 성공", async () => {
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
    };

    const expectedUser = {
      id: 1,
      name: "홍길동",
      email: "test@test.com",
      phoneNumber: plainPhoneNumber,
      nickname: "홍길동",
      moverImage: "test.jpg",
      userType: "MOVER",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    // Exercise
    const user = await userInfo("1", "MOVER");

    // Assertion
    expect(user).toEqual(expectedUser);
  });

  test("유저 정보 조회 실패 - 유저 정보 없음 NotFoundError(404) 발생", async () => {
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

  test("CUSTOMER 프로필 정보 조회 성공", async () => {
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

  test("MOVER 프로필 정보 조회 성공", async () => {
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

  test("CUSTOMER 프로필 정보 조회 실패 - 프로필 정보 없음 NotFoundError(404) 발생", async () => {
    // Setup
    const mockGetCustomerProfile =
      userRepository.getCustomerProfile as jest.Mock;
    mockGetCustomerProfile.mockResolvedValue(null);

    // Assertion
    await expect(getProfileData("1", "CUSTOMER")).rejects.toThrow(
      NotFoundError
    );
  });

  test("MOVER 프로필 정보 조회 실패 - 프로필 정보 없음 NotFoundError(404) 발생", async () => {
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

  test("CUSTOMER 프로필 등록 성공", async () => {
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
  });

  test("CUSTOMER 프로필 등록 실패 - 사용자 존재 확인 실패 NotFoundError(404) 발생", async () => {
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

  test("CUSTOMER 프로필 등록 실패 - 프로필 생성 데이터 유효성 검사 실패 ValidationError(422) 발생", async () => {
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

    const profileData = {
      nickname: "", // 유효성 실패 유도
      customerImage: "test.jpg",
      currentArea: "SEOUL" as RegionType,
      preferredServices: ["SMALL", "HOME"] as MoveType[],
    };

    // 사용자 존재 확인 모킹
    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(mockUser);

    // 유효성 검사 실패 유도
    const mockValidateCustomerProfileData =
      validateCustomerProfileData as jest.Mock;
    mockValidateCustomerProfileData.mockRejectedValue(
      new ValidationError("프로필 생성 데이터 유효성 검사 실패")
    );

    // Assertion
    await expect(createCustomerProfile("1", profileData)).rejects.toThrow(
      ValidationError
    );
  });
});

describe("userService.updateCustomerProfileCheck", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("CUSTOMER 프로필 수정 성공 - 반환값 없음", async () => {
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
  });

  test("CUSTOMER 프로필 수정 실패 - 사용자 존재 확인 실패 NotFoundError(404) 발생", async () => {
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

  test("CUSTOMER 프로필 수정 실패 - 현재 비밀번호 검증 실패 ValidationError(422) 발생", async () => {
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
});

describe("userService.createMoverProfile", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
});
describe("userService.updateMoverBasicInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("기사님 기본정보 수정 성공 - 이름만 수정", async () => {
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
    mockUpdateUserProfile.mockResolvedValue({ ...mockUser, name: "김기사수정" });

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", { name: "김기사수정" });
  });

  test("기사님 기본정보 수정 성공 - 전화번호만 수정", async () => {
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

  test("기사님 기본정보 수정 성공 - 비밀번호만 수정", async () => {
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

    const mockGetUserWithPassword = userRepository.getUserWithPassword as jest.Mock;
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

  test("기사님 기본정보 수정 성공 - 모든 필드 수정", async () => {
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

    const mockGetUserWithPassword = userRepository.getUserWithPassword as jest.Mock;
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

  test("기사님 기본정보 수정 실패 - 사용자 존재하지 않음 NotFoundError(404) 발생", async () => {
    // Setup
    const updateData = {
      name: "김기사수정",
    };

    const mockGetUserById = userRepository.getUserById as jest.Mock;
    mockGetUserById.mockResolvedValue(null);

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(NotFoundError);
    expect(mockGetUserById).toHaveBeenCalledWith("1");
  });

  test("기사님 기본정보 수정 실패 - 현재 비밀번호 불일치 ValidationError(422) 발생", async () => {
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

    const mockGetUserWithPassword = userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUserWithPassword);

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(ValidationError);
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
  });

  test("기사님 기본정보 수정 실패 - 현재 비밀번호 확인 불가 ValidationError(422) 발생", async () => {
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

    const mockGetUserWithPassword = userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(null); // 사용자 정보 없음

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(ValidationError);
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
  });

  test("기사님 기본정보 수정 실패 - 현재 비밀번호 없음 ValidationError(422) 발생", async () => {
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

    const mockGetUserWithPassword = userRepository.getUserWithPassword as jest.Mock;
    mockGetUserWithPassword.mockResolvedValue(mockUserWithPassword);

    // Assertion
    await expect(updateMoverBasicInfo("1", updateData)).rejects.toThrow(ValidationError);
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockGetUserWithPassword).toHaveBeenCalledWith("1");
  });

  test("기사님 기본정보 수정 성공 - 비밀번호 변경 없이 이름만 수정", async () => {
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
    mockUpdateUserProfile.mockResolvedValue({ ...mockUser, name: "김기사수정" });

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", { name: "김기사수정" });
    // getUserWithPassword는 호출되지 않아야 함 (비밀번호 변경이 없으므로)
  });

  test("기사님 기본정보 수정 성공 - 이름 앞뒤 공백 제거", async () => {
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
    mockUpdateUserProfile.mockResolvedValue({ ...mockUser, name: "김기사수정" });

    // Exercise
    await updateMoverBasicInfo("1", updateData);

    // Assertion
    expect(mockGetUserById).toHaveBeenCalledWith("1");
    expect(mockUpdateUserProfile).toHaveBeenCalledWith("1", { name: "김기사수정" }); // 공백 제거됨
  });
});

describe("userService.updateMoverProfileCheck", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
});

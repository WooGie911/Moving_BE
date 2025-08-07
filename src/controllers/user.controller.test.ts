import {
  getProfile,
  getUser,
  patchCustomerProfile,
  patchMoverBasicInfo,
  patchMoverProfile,
  postProfile,
} from "./user.controller";
import * as userService from "../services/user.service";
import { handleError } from "../utils/handleError";
import { Request, Response } from "express";
import {
  PROFILE_ERROR_MESSAGES,
  PROFILE_SUCCESS_MESSAGES,
} from "../constants/profile.constants";
import { TUserRole } from "../types/user.types";

jest.mock("../services/user.service");
jest.mock("../utils/handleError");

describe("유저 정보 조회 컨트롤러 (getUser)", () => {
  const mockUserInfo = userService.userInfo as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockReq = {
    user: {
      userId: "user-123",
      userType: "CUSTOMER",
    },
  } as Partial<Request> as Request;

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 유저 정보 조회 성공 시 응답 반환", async () => {
    const fakeUser = {
      id: "user-123",
      name: "홍길동",
      userType: "CUSTOMER",
    };

    mockUserInfo.mockResolvedValue(fakeUser);

    await getUser(mockReq, mockRes);

    expect(mockUserInfo).toHaveBeenCalledWith("user-123", "CUSTOMER");
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: fakeUser,
    });
  });

  it("❌ 유저 정보 조회 실패 시 handleError 호출", async () => {
    const error = new Error("조회 실패");
    mockUserInfo.mockRejectedValue(error);

    await getUser(mockReq, mockRes);

    expect(mockUserInfo).toHaveBeenCalled();
    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("프로필 조회 컨트롤러 (getProfile)", () => {
  const mockGetProfileData = userService.getProfileData as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockReq = {
    user: {
      userId: "user-456",
      userType: "MOVER",
    },
  } as Partial<Request> as Request;

  const mockRes = {
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 프로필 조회 성공 시 응답 반환", async () => {
    const mockProfile = {
      nickname: "이사왕",
      moverImage: "https://example.com/image.jpg",
      currentAreas: ["강남구", "송파구"],
      serviceTypes: ["소형이사", "보관이사"],
    };

    mockGetProfileData.mockResolvedValue(mockProfile);

    await getProfile(mockReq, mockRes);

    expect(mockGetProfileData).toHaveBeenCalledWith("user-456", "MOVER");
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: mockProfile,
    });
  });

  it("❌ 프로필 조회 실패 시 handleError 호출", async () => {
    const error = new Error("프로필 조회 실패");
    mockGetProfileData.mockRejectedValue(error);

    await getProfile(mockReq, mockRes);

    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("프로필 등록 컨트롤러 (postProfile)", () => {
  const mockCreateCustomerProfile =
    userService.createCustomerProfile as jest.Mock;
  const mockCreateMoverProfile = userService.createMoverProfile as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockRes = {
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ CUSTOMER 프로필 등록 성공 시 쿠키 설정 및 응답 반환", async () => {
    const mockReq = {
      user: { userId: "user-1", userType: "CUSTOMER" },
      body: {
        nickname: "홍길동",
        customerImage: "image.jpg",
        currentArea: "강남구",
        preferredServices: ["소형이사"],
      },
    } as Partial<Request> as Request;

    const fakeResult = {
      result: { id: "profile-1", nickname: "홍길동" },
      accessToken: "access-token",
      refreshToken: "refresh-token",
      provider: "LOCAL",
    };

    mockCreateCustomerProfile.mockResolvedValue(fakeResult);

    await postProfile(mockReq, mockRes);

    expect(mockCreateCustomerProfile).toHaveBeenCalledWith("user-1", {
      nickname: "홍길동",
      customerImage: "image.jpg",
      currentArea: "강남구",
      preferredServices: ["소형이사"],
    });

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "accessToken",
      "access-token",
      expect.objectContaining({ httpOnly: false })
    );
    expect(mockRes.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.any(Object)
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: PROFILE_SUCCESS_MESSAGES.CUSTOMER_PROFILE_CREATED,
      data: fakeResult.result,
    });
  });

  it("✅ MOVER 프로필 등록 성공 시 쿠키 설정 및 응답 반환", async () => {
    const mockReq = {
      user: { userId: "user-2", userType: "MOVER" },
      body: {
        nickname: "이사왕",
        moverImage: "mover.jpg",
        career: 5,
        shortIntro: "짧은 소개",
        detailIntro: "긴 소개입니다.",
        currentAreas: ["송파구", "서초구"],
        serviceTypes: ["보관이사"],
      },
    } as Partial<Request> as Request;

    const fakeResult = {
      result: { id: "profile-2", nickname: "이사왕" },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    mockCreateMoverProfile.mockResolvedValue(fakeResult);

    await postProfile(mockReq, mockRes);

    expect(mockCreateMoverProfile).toHaveBeenCalledWith("user-2", {
      nickname: "이사왕",
      moverImage: "mover.jpg",
      career: 5,
      shortIntro: "짧은 소개",
      detailIntro: "긴 소개입니다.",
      currentAreas: ["송파구", "서초구"],
      serviceTypes: ["보관이사"],
    });

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "accessToken",
      "access-token",
      expect.objectContaining({ httpOnly: false })
    );
    expect(mockRes.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.any(Object)
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: PROFILE_SUCCESS_MESSAGES.MOVER_PROFILE_CREATED,
      data: fakeResult.result,
    });
  });

  it("❌ 유효하지 않은 userType일 경우 400 반환", async () => {
    const mockReq = {
      user: { userId: "user-3", userType: "ADMIN" as unknown as TUserRole }, // 잘못된 userType
      body: {},
    } as Partial<Request> as Request;

    await postProfile(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: PROFILE_ERROR_MESSAGES.INVALID_USER_ROLE,
    });
  });

  it("❌ CUSTOMER 프로필 등록 중 오류 발생 시 handleError 호출", async () => {
    const mockReq = {
      user: { userId: "user-4", userType: "CUSTOMER" },
      body: {
        nickname: "에러고객",
        customerImage: "error.jpg",
        currentArea: "노원구",
        preferredServices: ["원룸이사"],
      },
    } as Partial<Request> as Request;

    const error = new Error("등록 실패");
    mockCreateCustomerProfile.mockRejectedValue(error);

    await postProfile(mockReq, mockRes);

    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });

  it("❌ MOVER 프로필 등록 중 오류 발생 시 handleError 호출", async () => {
    const mockReq = {
      user: { userId: "user-5", userType: "MOVER" },
      body: {
        nickname: "에러기사",
        moverImage: "mover.jpg",
        career: 1,
        shortIntro: "에러 짧은 소개",
        detailIntro: "에러 긴 소개",
        currentAreas: ["성북구"],
        serviceTypes: ["가정이사"],
      },
    } as Partial<Request> as Request;

    const error = new Error("등록 실패");
    mockCreateMoverProfile.mockRejectedValue(error);

    await postProfile(mockReq, mockRes);

    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("일반 유저 프로필 수정 컨트롤러 (patchCustomerProfile)", () => {
  const mockUpdateCustomerProfileCheck =
    userService.updateCustomerProfileCheck as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockRes = {
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 일반 유저 프로필 수정 성공 시 응답 반환", async () => {
    const mockReq = {
      user: { userId: "user-1" },
      body: {
        name: "홍길동",
        nickname: "길동이",
        email: "gil@example.com",
        phoneNumber: "01012345678",
        password: "oldPass123!",
        newPassword: "newPass456!",
        customerImage: "image.jpg",
        currentArea: "강남구",
        preferredServices: ["소형이사"],
      },
    } as Partial<Request> as Request;

    await patchCustomerProfile(mockReq, mockRes);

    expect(mockUpdateCustomerProfileCheck).toHaveBeenCalledWith("user-1", {
      name: "홍길동",
      nickname: "길동이",
      email: "gil@example.com",
      phoneNumber: "01012345678",
      password: "oldPass123!",
      newPassword: "newPass456!",
      customerImage: "image.jpg",
      currentArea: "강남구",
      preferredServices: ["소형이사"],
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: PROFILE_SUCCESS_MESSAGES.CUSTOMER_PROFILE_UPDATED,
      data: {
        name: "홍길동",
        nickname: "길동이",
        email: "gil@example.com",
        phoneNumber: "01012345678",
        password: "oldPass123!",
        newPassword: "newPass456!",
        customerImage: "image.jpg",
        currentArea: "강남구",
        preferredServices: ["소형이사"],
      },
    });
  });

  it("❌ 프로필 수정 중 오류 발생 시 handleError 호출", async () => {
    const mockReq = {
      user: { userId: "user-2" },
      body: {
        name: "에러유저",
      },
    } as Partial<Request> as Request;

    const error = new Error("수정 실패");
    mockUpdateCustomerProfileCheck.mockRejectedValue(error);

    await patchCustomerProfile(mockReq, mockRes);

    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("기사님 기본정보 수정 컨트롤러 (patchMoverBasicInfo)", () => {
  const mockUpdateMoverBasicInfo =
    userService.updateMoverBasicInfo as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockRes = {
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 기사님 기본정보 수정 성공 시 응답 반환", async () => {
    const mockReq = {
      user: { userId: "user-123" },
      body: {
        name: "이사왕",
        phoneNumber: "01012345678",
        currentPassword: "oldpass123",
        newPassword: "newpass456",
      },
    } as Partial<Request> as Request;

    await patchMoverBasicInfo(mockReq, mockRes);

    expect(mockUpdateMoverBasicInfo).toHaveBeenCalledWith("user-123", {
      name: "이사왕",
      phoneNumber: "01012345678",
      currentPassword: "oldpass123",
      newPassword: "newpass456",
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "기사님 기본정보가 성공적으로 수정되었습니다.",
    });
  });

  it("❌ 수정 중 오류 발생 시 handleError 호출", async () => {
    const mockReq = {
      user: { userId: "user-123" },
      body: {
        name: "이사왕",
      },
    } as Partial<Request> as Request;

    const error = new Error("수정 실패");
    mockUpdateMoverBasicInfo.mockRejectedValue(error);

    await patchMoverBasicInfo(mockReq, mockRes);

    expect(mockHandleError).toHaveBeenCalledWith(
      mockRes,
      error,
      "기사님 기본정보 수정 중 오류가 발생했습니다"
    );
  });
});

describe("기사님 프로필 수정 컨트롤러 (patchMoverProfile)", () => {
  const mockUpdateMoverProfileCheck =
    userService.updateMoverProfileCheck as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockRes = {
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 기사님 프로필 수정 성공 시 응답 반환", async () => {
    const mockReq = {
      user: { userId: "user-456" },
      body: {
        nickname: "이사천국",
        moverImage: "mover.jpg",
        currentAreas: ["강남구", "송파구"],
        serviceTypes: ["소형이사"],
        shortIntro: "짧은 소개",
        detailIntro: "긴 소개글입니다.",
        career: 10,
        isVeteran: true,
      },
    } as Partial<Request> as Request;

    const fakeResult = {
      nickname: "이사천국",
      career: 10,
      isVeteran: true,
    };

    mockUpdateMoverProfileCheck.mockResolvedValue(fakeResult);

    await patchMoverProfile(mockReq, mockRes);

    expect(mockUpdateMoverProfileCheck).toHaveBeenCalledWith("user-456", {
      nickname: "이사천국",
      moverImage: "mover.jpg",
      currentAreas: ["강남구", "송파구"],
      serviceTypes: ["소형이사"],
      shortIntro: "짧은 소개",
      detailIntro: "긴 소개글입니다.",
      career: 10,
      isVeteran: true,
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "기사님 프로필이 성공적으로 수정되었습니다.",
      data: fakeResult,
    });
  });

  it("❌ 수정 중 오류 발생 시 handleError 호출", async () => {
    const mockReq = {
      user: { userId: "user-456" },
      body: {
        nickname: "에러기사",
      },
    } as Partial<Request> as Request;

    const error = new Error("수정 실패");
    mockUpdateMoverProfileCheck.mockRejectedValue(error);

    await patchMoverProfile(mockReq, mockRes);

    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

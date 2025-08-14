import { Request, Response } from "express";
import authService from "../services/auth.service";
import { handleError } from "../utils/handleError";
import {
  getGoogleCallback,
  getKakaoCallback,
  getNaverCallback,
  postLogout,
  postRefresh,
  postSignin,
  postSignup,
  postSwitchRole,
} from "./auth.controller";
import { TUserRole } from "../types/user.types";

jest.mock("../services/auth.service");
jest.mock("../utils/handleError");

describe("로그인 컨트롤러", () => {
  const mockSignin = authService.signin as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockReq = {
    body: {
      email: "test@example.com",
      password: "password123",
      userType: "CUSTOMER",
    },
  } as Partial<Request> as Request;

  const mockRes = {
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 로그인 성공 시 쿠키와 응답 반환", async () => {
    // setup
    const fakeUser = {
      id: 1,
      userName: "홍길동",
      userType: "CUSTOMER",
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    mockSignin.mockResolvedValue(fakeUser);

    // exercise
    await postSignin(mockReq, mockRes);

    // assertion
    expect(mockSignin).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
      "CUSTOMER"
    );
    expect(mockRes.cookie).toHaveBeenCalledTimes(2);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "로그인 성공",
      user: {
        id: 1,
        userName: "홍길동",
        userType: "CUSTOMER",
      },
    });
  });

  it("❌ 로그인 실패 시 handleError 호출", async () => {
    // setup
    const error = new Error("로그인 실패");
    mockSignin.mockRejectedValue(error);

    // exercise
    await postSignin(mockReq, mockRes);

    // assertion
    expect(mockSignin).toHaveBeenCalled();
    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("회원가입 컨트롤러", () => {
  const mockSignup = authService.signup as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockReq = {
    body: {
      name: "홍길동",
      email: "hong@test.com",
      phoneNumber: "01012345678",
      password: "1234abcd!",
      userType: "CUSTOMER",
    },
  } as Partial<Request> as Request;

  const mockRes = {
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 회원가입 성공 시 쿠키 설정 및 201 응답 반환", async () => {
    const fakeUser = {
      id: 100,
      userName: "홍길동",
      userType: "CUSTOMER",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    };

    mockSignup.mockResolvedValue(fakeUser);

    await postSignup(mockReq, mockRes);

    expect(mockSignup).toHaveBeenCalledWith({
      name: "홍길동",
      email: "hong@test.com",
      phoneNumber: "01012345678",
      password: "1234abcd!",
      userType: "CUSTOMER",
    });

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "accessToken",
      "mock-access-token",
      expect.objectContaining({ httpOnly: false }) // 실제 옵션 타입 매칭
    );

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "mock-refresh-token",
      expect.objectContaining({ httpOnly: true })
    );

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "회원가입 성공",
      user: {
        id: 100,
        userName: "홍길동",
        userType: "CUSTOMER",
      },
    });
  });

  it("❌ 회원가입 실패 시 handleError 호출", async () => {
    const error = new Error("회원가입 실패");
    mockSignup.mockRejectedValue(error);

    await postSignup(mockReq, mockRes);

    expect(mockSignup).toHaveBeenCalled();
    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("로그아웃 컨트롤러", () => {
  const mockLogout = authService.logout as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockReq = {
    user: {
      userId: "user-123",
    },
  } as Partial<Request> as Request;

  const mockRes = {
    clearCookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 로그아웃 성공 시 쿠키 삭제 및 200 반환", async () => {
    mockLogout.mockResolvedValue(undefined); // 반환 없음

    await postLogout(mockReq, mockRes);

    expect(mockLogout).toHaveBeenCalledWith("user-123");

    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      "accessToken",
      expect.objectContaining({ maxAge: 0 })
    );
    expect(mockRes.clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({ maxAge: 0 })
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "로그아웃 성공",
    });
  });

  it("❌ 로그아웃 실패 시 handleError 호출", async () => {
    const error = new Error("로그아웃 실패");
    mockLogout.mockRejectedValue(error);

    await postLogout(mockReq, mockRes);

    expect(mockLogout).toHaveBeenCalledWith("user-123");
    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("역할 변경 컨트롤러", () => {
  const mockSwitchRole = authService.switchRole as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockReq = {
    user: {
      userId: "user-123",
      userType: "CUSTOMER" as TUserRole,
    },
    body: {
      userType: "MOVER" as TUserRole,
    },
  } as Partial<Request> as Request;

  const mockRes = {
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ 역할 변경 성공 시 토큰 설정 및 응답 반환", async () => {
    mockSwitchRole.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      provider: "LOCAL",
    });

    await postSwitchRole(mockReq, mockRes);

    expect(mockSwitchRole).toHaveBeenCalledWith("user-123", "MOVER");

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "accessToken",
      "new-access-token",
      expect.objectContaining({ httpOnly: false })
    );

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "new-refresh-token",
      expect.objectContaining({ httpOnly: true })
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "역할 변경 성공",
      oldUserType: "CUSTOMER",
      newUserType: "MOVER",
    });
  });

  it("❌ 역할 변경 실패 시 handleError 호출", async () => {
    const error = new Error("역할 변경 실패");
    mockSwitchRole.mockRejectedValue(error);

    await postSwitchRole(mockReq, mockRes);

    expect(mockSwitchRole).toHaveBeenCalledWith("user-123", "MOVER");
    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("토큰 갱신 컨트롤러", () => {
  const mockRefresh = authService.refresh as jest.Mock;
  const mockHandleError = handleError as jest.Mock;

  const mockReq = {
    refreshToken: {
      userId: "user-123",
      userType: "CUSTOMER" as TUserRole,
      exp: 9999999999,
    },
  } as Partial<Request> as Request;

  const mockRes = {
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response> as Response;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("✅ accessToken만 갱신되는 경우", async () => {
    mockRefresh.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: undefined,
    });

    await postRefresh(mockReq, mockRes);

    expect(mockRefresh).toHaveBeenCalledWith({
      userId: "user-123",
      userType: "CUSTOMER",
      exp: 9999999999,
    });

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "accessToken",
      "new-access-token",
      expect.objectContaining({ httpOnly: false })
    );

    expect(mockRes.cookie).toHaveBeenCalledTimes(1); // refreshToken 없음
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "토큰 갱신 성공",
    });
  });

  it("✅ accessToken + refreshToken 모두 갱신되는 경우", async () => {
    mockRefresh.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    await postRefresh(mockReq, mockRes);

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "accessToken",
      "new-access-token",
      expect.objectContaining({ httpOnly: false })
    );

    expect(mockRes.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "new-refresh-token",
      expect.objectContaining({ httpOnly: true })
    );

    expect(mockRes.cookie).toHaveBeenCalledTimes(2);
  });

  it("❌ 갱신 실패 시 handleError 호출", async () => {
    const error = new Error("리프레시 실패");
    mockRefresh.mockRejectedValue(error);

    await postRefresh(mockReq, mockRes);

    expect(mockHandleError).toHaveBeenCalledWith(mockRes, error);
  });
});

describe("소셜 로그인 콜백 컨트롤러", () => {
  beforeAll(() => {
    // 로컬 테스트용
    process.env.FRONTEND_URL = "http://localhost:3000";
  });

  describe("구글 로그인 콜백 컨트롤러", () => {
    const baseUser = {
      accessToken: "google-access-token",
      refreshToken: "google-refresh-token",
      userType: "CUSTOMER",
    };

    // ✅ Mock된 Request 생성기
    const createMockReq = (user = baseUser): Request =>
      ({ user }) as unknown as Request;

    // ✅ Mock된 Response 생성기
    const createMockRes = (): Response =>
      ({
        cookie: jest.fn(),
        redirect: jest.fn(),
      }) as unknown as Response;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("✅ 로그인 성공 시 쿠키 설정 후 유저타입별 경로로 리다이렉트", async () => {
      const req = createMockReq();
      const res = createMockRes();

      await getGoogleCallback(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        baseUser.accessToken,
        expect.any(Object)
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        baseUser.refreshToken,
        expect.any(Object)
      );
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/searchMover`
      );
    });

    it("❌ 쿠키 설정 실패 시 CUSTOMER → /userSignin 리다이렉트", async () => {
      const req = createMockReq({ ...baseUser, userType: "CUSTOMER" });
      const res = createMockRes();

      res.cookie = jest.fn(() => {
        throw new Error("쿠키 설정 실패");
      });

      await getGoogleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/\/userSignin\?/)
      );
    });

    it("❌ 쿠키 설정 실패 시 MOVER → /moverSignin 리다이렉트", async () => {
      const req = createMockReq({ ...baseUser, userType: "MOVER" });
      const res = createMockRes();

      res.cookie = jest.fn(() => {
        throw new Error("쿠키 설정 실패");
      });

      await getGoogleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/\/moverSignin\?/)
      );
    });
  });

  describe("카카오 로그인 콜백 컨트롤러", () => {
    const baseUser = {
      accessToken: "kakao-access-token",
      refreshToken: "kakao-refresh-token",
      userType: "CUSTOMER",
    };

    // ✅ Mock된 Request 생성기
    const createMockReq = (user = baseUser): Request =>
      ({ user }) as unknown as Request;

    // ✅ Mock된 Response 생성기
    const createMockRes = (): Response =>
      ({
        cookie: jest.fn(),
        redirect: jest.fn(),
      }) as unknown as Response;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("✅ 로그인 성공 시 쿠키 설정 후 유저타입별 경로로 리다이렉트", async () => {
      const req = createMockReq();
      const res = createMockRes();

      await getKakaoCallback(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        baseUser.accessToken,
        expect.any(Object)
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        baseUser.refreshToken,
        expect.any(Object)
      );
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/searchMover`
      );
    });

    it("❌ 쿠키 설정 실패 시 CUSTOMER → /userSignin 리다이렉트", async () => {
      const req = createMockReq({ ...baseUser, userType: "CUSTOMER" });
      const res = createMockRes();

      res.cookie = jest.fn(() => {
        throw new Error("쿠키 설정 실패");
      });

      await getKakaoCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/\/userSignin\?/)
      );
    });

    it("❌ 쿠키 설정 실패 시 MOVER → /moverSignin 리다이렉트", async () => {
      const req = createMockReq({ ...baseUser, userType: "MOVER" });
      const res = createMockRes();

      res.cookie = jest.fn(() => {
        throw new Error("쿠키 설정 실패");
      });

      await getKakaoCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/\/moverSignin\?/)
      );
    });
  });

  describe("네이버 로그인 콜백 컨트롤러", () => {
    const baseUser = {
      accessToken: "kakao-access-token",
      refreshToken: "kakao-refresh-token",
      userType: "CUSTOMER",
    };

    // ✅ Mock된 Request 생성기
    const createMockReq = (user = baseUser): Request =>
      ({ user }) as unknown as Request;

    // ✅ Mock된 Response 생성기
    const createMockRes = (): Response =>
      ({
        cookie: jest.fn(),
        redirect: jest.fn(),
      }) as unknown as Response;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("✅ 로그인 성공 시 쿠키 설정 후 유저타입별 경로로 리다이렉트", async () => {
      const req = createMockReq();
      const res = createMockRes();

      await getNaverCallback(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        baseUser.accessToken,
        expect.any(Object)
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        baseUser.refreshToken,
        expect.any(Object)
      );
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/searchMover`
      );
    });

    it("❌ 쿠키 설정 실패 시 CUSTOMER → /userSignin 리다이렉트", async () => {
      const req = createMockReq({ ...baseUser, userType: "CUSTOMER" });
      const res = createMockRes();

      res.cookie = jest.fn(() => {
        throw new Error("쿠키 설정 실패");
      });

      await getNaverCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/\/userSignin\?/)
      );
    });

    it("❌ 쿠키 설정 실패 시 MOVER → /moverSignin 리다이렉트", async () => {
      const req = createMockReq({ ...baseUser, userType: "MOVER" });
      const res = createMockRes();

      res.cookie = jest.fn(() => {
        throw new Error("쿠키 설정 실패");
      });

      await getNaverCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/\/moverSignin\?/)
      );
    });
  });
});

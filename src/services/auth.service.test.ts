import bcrypt from "bcrypt";
import authRepository from "../repositories/auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
} from "../utils/generateToken";
import authService from "./auth.service";
import {
  AuthenticationError,
  DatabaseError,
  NotFoundError,
  ServerError,
  ValidationError,
} from "../types/commonError.types";
import { TUserRole } from "../types/user.types";
import { validateUserSignupInput } from "../utils/validators/userValidator";
import * as authUtils from "../utils/authUtils";
import actionRepository from "../repositories/action.repository";

jest.mock("../repositories/auth.repository");
jest.mock("bcrypt");
jest.mock("../utils/generateToken");
jest.mock("../utils/validators/userValidator");
jest.mock("../utils/authUtils", () => ({
  mergeUserTypes: jest.fn(),
}));
jest.mock("../repositories/action.repository");

describe("authService.signup", () => {
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
    // validateUserSignupInput 초기화
    (validateUserSignupInput as jest.Mock).mockReset();
  });

  it("CUSTOMER 회원가입 성공", async () => {
    // Setup
    // DB createUser 반환값 테스트용 객체
    const mockUser = {
      id: "1",
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      nickname: "홍길동",
    };

    // Exercise 테스트용 유저 객체 생성
    const testUser = {
      name: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      password: "1rhdiddl!",
      userType: "CUSTOMER" as TUserRole,
    };

    // email 중복 체크 로직 모킹
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null);

    // 비밀번호 암호화 로직 모킹
    const mockHash = bcrypt.hash as jest.Mock;
    mockHash.mockResolvedValue("$2b$10$hashedpassword");

    // 유저 생성 로직 모킹
    const mockCreateUser = authRepository.createUser as jest.Mock;
    mockCreateUser.mockResolvedValue(mockUser);

    // 추가
    const mockCreateAction = actionRepository.createAction as jest.Mock;
    mockCreateAction.mockResolvedValue({});

    // 토큰 생성용 로직 모킹
    const mockGenerateToken = generateToken as jest.Mock;
    mockGenerateToken.mockReturnValue({
      newAccessToken: "mockAccessToken",
      newRefreshToken: "mockRefreshToken",
    });

    // Exercise
    const result = await authService.signup(testUser);

    // Assertion

    // 회원가입 반환값 검사
    expect(result).toMatchObject({
      id: mockUser.id,
      userName: testUser.name,
      userType: "CUSTOMER",
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
    });
  });

  it("MOVER 회원가입 성공", async () => {
    // Setup
    // DB createUser 반환값 테스트용 객체
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      nickname: "홍길동",
    };

    // Exercise 테스트용 유저 객체 생성
    const testUser = {
      name: "홍길동",
      email: "test@test.com",
      phoneNumber: "01012345678",
      password: "1rhdiddl!",
      userType: "MOVER" as TUserRole,
    };

    // email 중복 체크 로직 모킹
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null);

    // 비밀번호 암호화 로직 모킹
    const mockHash = bcrypt.hash as jest.Mock;
    mockHash.mockResolvedValue("$2b$10$hashedpassword");

    // 유저 생성 로직 모킹
    const mockCreateUser = authRepository.createUser as jest.Mock;
    mockCreateUser.mockResolvedValue(mockUser);

    // 토큰 생성용 로직 모킹
    const mockGenerateToken = generateToken as jest.Mock;
    mockGenerateToken.mockReturnValue({
      newAccessToken: "mockAccessToken",
      newRefreshToken: "mockRefreshToken",
    });

    // Exercise
    const result = await authService.signup(testUser);

    // Assertion

    // 회원가입 반환값 검사
    expect(result).toMatchObject({
      id: mockUser.id,
      userName: testUser.name,
      userType: "MOVER",
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
    });
  });

  it("회원가입 실패 - 이메일 중복 ValidationError(422) 발생", async () => {
    // Setup
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      nickname: "홍길동",
    };

    // 이메일이 중복 되는 경우 예외 처리 (ValidationError)
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(mockUser);

    // Assertion
    // 이메일이 중복 되는 경우 ValidationError 발생
    await expect(
      authService.signup({
        name: "홍길동",
        email: "test@test.com",
        phoneNumber: "01012345678",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("회원가입 실패 - 잘못된 이메일 형식이면 ValidationError(422) 발생", async () => {
    // 💡 validateUserSignupInput 직접 throw 시뮬레이션
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null); // 중복 아님

    const mockValidateUserSignupInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSignupInput.mockImplementation(() => {
      throw new ValidationError(
        "올바른 이메일 형식이 아니거나 허용되지 않는 도메인입니다."
      );
    });

    /**
     * 이메일 유효성 검사
     * - 기본 이메일 구문 검사
     * - 허용된 TLD 검사
     */
    await expect(
      authService.signup({
        name: "홍길동",
        email: "not-an-email",
        phoneNumber: "01012345678",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("회원가입 실패 - 잘못된 비밀번호 형식이면 ValidationError(422) 발생", async () => {
    // 💡 validateUserSignupInput 직접 throw 시뮬레이션
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null); // 중복 아님

    const mockValidateUserSignupInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSignupInput.mockImplementation(() => {
      throw new ValidationError("올바른 비밀번호 형식이 아닙니다.");
    });

    /**
     * 비밀번호 유효성 검사
     * - 최소 8자 이상
     * - 영문, 숫자, 특수문자 각각 1개 이상 포함
     */
    await expect(
      authService.signup({
        name: "홍길동",
        email: "test@test.com",
        phoneNumber: "01012345678",
        password: "2222",
        userType: "CUSTOMER",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("회원가입 실패 - 잘못된 이름 형식이면 ValidationError(422) 발생", async () => {
    // 💡 validateUserSignupInput 직접 throw 시뮬레이션
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null); // 중복 아님

    const mockValidateUserSignupInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSignupInput.mockImplementation(() => {
      throw new ValidationError("올바른 이름 형식이 아닙니다.");
    });

    /**
     * 이름 유효성 검사
     * - 한글, 영문, 중국어
     * 최소 2자이상
     * 최대 15자 이하
     */
    await expect(
      authService.signup({
        name: "홍길동123",
        email: "test@test.com",
        phoneNumber: "01012345678",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("회원가입 실패 - 잘못된 전화번호 형식이면 ValidationError(422) 발생", async () => {
    // 💡 validateUserSignupInput 직접 throw 시뮬레이션
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null); // 중복 아님

    const mockValidateUserSignupInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSignupInput.mockImplementation(() => {
      throw new ValidationError("올바른 전화번호 형식이 아닙니다.");
    });

    /**
     * 전화번호 유효성 검사 (010xxxxxxxx)
     */
    await expect(
      authService.signup({
        name: "홍길동",
        email: "test@test.com",
        phoneNumber: "010123456789",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("회원가입 실패 - 유저 생성 실패시 DatabaseError(500) 발생", async () => {
    // Setup
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null);

    // 유저 생성이 null로 반환되는 경우 예외 처리 (DatabaseError)
    const mockCreateUser = authRepository.createUser as jest.Mock;
    mockCreateUser.mockResolvedValue(null);

    // Assertion
    await expect(
      authService.signup({
        name: "홍길동",
        email: "test@test.com",
        phoneNumber: "01012345678",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
    ).rejects.toThrow(DatabaseError);
  });

  it("회원가입 실패 - 토큰 생성 실패시 ServerError(500) 발생", async () => {
    // Setup
    const mockUser = {
      id: "1",
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      nickname: "홍길동",
    };

    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null);

    const mockCreateUser = authRepository.createUser as jest.Mock;
    mockCreateUser.mockResolvedValue(mockUser);

    // 토큰 생성이 null로 반환되는 경우 예외 처리 (ServerError)
    const mockGenerateToken = generateToken as jest.Mock;
    mockGenerateToken.mockReturnValue({
      newAccessToken: null,
      newRefreshToken: null,
    });

    // Assertion
    await expect(
      authService.signup({
        name: "홍길동",
        email: "test@test.com",
        phoneNumber: "01012345678",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
    ).rejects.toThrow(ServerError);
  });

  it("회원가입 시 generateToken 인자 검증(hasProfile=false)", async () => {
    const mockUser = {
      id: "10",
      name: "임꺽정",
      userType: ["CUSTOMER"],
      nickname: "임꺽정",
    };

    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$hashedpassword");
    (authRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

    const mockGenerateToken = generateToken as jest.Mock;
    mockGenerateToken.mockReturnValue({
      newAccessToken: "mockAccessToken",
      newRefreshToken: "mockRefreshToken",
    });

    await authService.signup({
      name: "임꺽정",
      email: "im@example.com",
      phoneNumber: "01012345678",
      password: "1rhdiddl!",
      userType: "CUSTOMER",
    });

    expect(mockGenerateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: String(mockUser.id),
        name: mockUser.name,
        userType: "CUSTOMER",
        hasProfile: false,
      })
    );
  });

  it("회원가입 입력 유효성 검사 함수 호출 여부 검증", async () => {
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$hashedpassword");
    (authRepository.createUser as jest.Mock).mockResolvedValue({
      id: "11",
      name: "장보고",
      userType: ["CUSTOMER"],
    });
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "at",
      newRefreshToken: "rt",
    });

    await authService.signup({
      name: "장보고",
      email: "jang@example.com",
      phoneNumber: "01012345678",
      password: "1rhdiddl!",
      userType: "CUSTOMER",
    });

    expect(validateUserSignupInput).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "장보고",
        email: "jang@example.com",
        phoneNumber: "01012345678",
      })
    );
  });
});

describe("authService.signin", () => {
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
    // validateUserSignupInput 초기화
    (validateUserSignupInput as jest.Mock).mockReset();
  });

  it("CUSTOMER 로그인 성공", async () => {
    // Setup
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      email: "test@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      customerImage: "https://cdn.com/image.png",
      moverImage: null,
      isCustomer: true,
      isMover: false,
      provider: "LOCAL",
    };

    // 로그인 검증용 로직 모킹
    const mockFindUserByEmailAndPassword =
      authRepository.findUserByEmailAndPassword as jest.Mock;

    // 비밀번호 검증용 로직 모킹
    const mockCompare = bcrypt.compare as jest.Mock;

    // 토큰 생성용 로직 모킹
    const mockGenerateToken = generateToken as jest.Mock;

    // 토큰 업데이트용 로직 모킹
    const mockUpdateUserToken = authRepository.updateUserToken as jest.Mock;

    // Mock 함수의 반환값 설정
    mockFindUserByEmailAndPassword.mockResolvedValue(mockUser);
    mockCompare.mockResolvedValue(true);
    mockGenerateToken.mockReturnValue({
      newAccessToken: "mockAccessToken",
      newRefreshToken: "mockRefreshToken",
    });
    mockUpdateUserToken.mockResolvedValue(undefined);

    // Exercise
    const result = await authService.signin(
      "test@test.com",
      "1rhdiddl!",
      "CUSTOMER"
    );

    // Assertion
    expect(result).toMatchObject({
      id: mockUser.id,
      userName: mockUser.name,
      userType: "CUSTOMER",
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
    });
  });

  it("MOVER 로그인 성공", async () => {
    // Setup
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      email: "test@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      customerImage: "https://cdn.com/image.png",
      moverImage: null,
      isCustomer: false,
      isMover: true,
      provider: "LOCAL",
    };

    // 로그인 검증용 로직 모킹
    const mockFindUserByEmailAndPassword =
      authRepository.findUserByEmailAndPassword as jest.Mock;

    // 비밀번호 검증용 로직 모킹
    const mockCompare = bcrypt.compare as jest.Mock;

    // 토큰 생성용 로직 모킹
    const mockGenerateToken = generateToken as jest.Mock;

    // 토큰 업데이트용 로직 모킹
    const mockUpdateUserToken = authRepository.updateUserToken as jest.Mock;

    // Mock 함수의 반환값 설정
    mockFindUserByEmailAndPassword.mockResolvedValue(mockUser);
    mockCompare.mockResolvedValue(true);
    mockGenerateToken.mockReturnValue({
      newAccessToken: "mockAccessToken",
      newRefreshToken: "mockRefreshToken",
    });
    mockUpdateUserToken.mockResolvedValue(undefined);

    // Exercise
    const result = await authService.signin(
      "test@test.com",
      "1rhdiddl!",
      "MOVER"
    );

    // Assertion
    expect(result).toMatchObject({
      id: mockUser.id,
      userName: mockUser.name,
      userType: "MOVER",
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
    });
  });

  it("로그인 실패 - 잘못된 이메일 형식이면 ValidationError(422) 발생", async () => {
    // Setup
    const mockValidateUserSigninInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSigninInput.mockImplementation(() => {
      throw new ValidationError(
        "올바른 이메일 형식이 아니거나 허용되지 않는 도메인입니다."
      );
    });

    // Assertion
    await expect(
      authService.signin("not-an-email", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(ValidationError);
  });

  it("로그인 실패 - 잘못된 비밀번호 형식이면 ValidationError(422) 발생", async () => {
    // Setup
    const mockValidateUserSigninInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSigninInput.mockImplementation(() => {
      throw new ValidationError(
        "비밀번호는 최소 8자 이상이며 영문, 숫자, 특수문자를 각각 포함해야 합니다."
      );
    });

    // Assertion
    await expect(
      authService.signin("test@test.com", "2222", "CUSTOMER")
    ).rejects.toThrow(ValidationError);
  });

  it("로그인 실패 - 존재하지 않는 유저(리포지토리 null)면 AuthenticationError(401)", async () => {
    // Setup: 유효성 검사는 통과시키고, 레포는 null 반환
    (validateUserSignupInput as jest.Mock).mockImplementation(() => undefined);
    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      null
    );

    // Assertion
    await expect(
      authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(AuthenticationError);
    await expect(
      authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow("존재하지 않는 유저입니다");
  });

  it("로그인 실패 - 비밀번호 불일치 라면 AuthenticationError(401) 발생", async () => {
    // Setup
    const mockValidateUserSigninInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSigninInput.mockImplementation(() => {
      throw new AuthenticationError("비밀번호가 일치하지 않습니다");
    });

    // Assertion
    await expect(
      authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(AuthenticationError);
  });

  it("로그인 실패 - 토큰 생성 실패시 ServerError(500) 발생", async () => {
    // Setup: 로그인 성공 조건 세팅
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      email: "test@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      customerImage: "https://cdn.com/image.png",
      moverImage: null,
      isCustomer: false,
      isMover: true,
      provider: "LOCAL",
    };

    const mockFindUser = authRepository.findUserByEmailAndPassword as jest.Mock;
    mockFindUser.mockResolvedValue(mockUser);

    const mockCompare = bcrypt.compare as jest.Mock;
    mockCompare.mockResolvedValue(true); // 비밀번호 일치

    const mockGenerateToken = generateToken as jest.Mock;
    mockGenerateToken.mockReturnValue({
      newAccessToken: null,
      newRefreshToken: null,
    });

    // Assertion
    await expect(
      authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(ServerError);
  });

  it("소셜 로그인 유저면 AuthenticationError(401)", async () => {
    const mockUser = {
      id: 1,
      name: "소셜유저",
      userType: ["CUSTOMER"],
      email: "social@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      provider: "GOOGLE",
    };

    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      mockUser
    );

    await expect(
      authService.signin("social@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(AuthenticationError);
  });

  it("비밀번호 불일치면 AuthenticationError(401)", async () => {
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      email: "test@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      provider: "LOCAL",
    };

    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      mockUser
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.signin("test@test.com", "wrongpass!", "CUSTOMER")
    ).rejects.toThrow(AuthenticationError);
  });

  it("CUSTOMER만 가진 유저가 MOVER로 로그인하면 타입 병합 후 토큰 업데이트", async () => {
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      email: "test@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      provider: "LOCAL",
      isCustomer: true,
      isMover: false,
    };

    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      mockUser
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "mockAccessToken",
      newRefreshToken: "mockRefreshToken",
    });
    const mockUpdate = authRepository.updateUserToken as jest.Mock;
    mockUpdate.mockResolvedValue(undefined);

    await authService.signin("test@test.com", "1rhdiddl!", "MOVER");

    expect(mockUpdate).toHaveBeenCalledWith(
      String(mockUser.id),
      "mockRefreshToken",
      ["CUSTOMER", "MOVER"]
    );
  });

  it("generateToken 호출 시 hasProfile 맵핑 검증(CUSTOMER/MOVER)", async () => {
    const baseUser: any = {
      id: 2,
      name: "사용자",
      userType: ["CUSTOMER", "MOVER"],
      email: "u@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      provider: "LOCAL",
      isCustomer: true,
      isMover: false,
    };

    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      baseUser
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const mockGen = generateToken as jest.Mock;
    mockGen.mockReturnValue({ newAccessToken: "a", newRefreshToken: "r" });
    (authRepository.updateUserToken as jest.Mock).mockResolvedValue(undefined);

    await authService.signin("u@test.com", "1rhdiddl!", "CUSTOMER");
    expect((mockGen as jest.Mock).mock.calls.slice(-1)[0][0].hasProfile).toBe(
      true
    );

    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue({
      ...baseUser,
      isCustomer: false,
      isMover: true,
    });
    await authService.signin("u@test.com", "1rhdiddl!", "MOVER");
    expect((mockGen as jest.Mock).mock.calls.slice(-1)[0][0].hasProfile).toBe(
      true
    );
  });

  it("로그인 입력 유효성 검사 함수 호출 여부 검증", async () => {
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      email: "test@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      isCustomer: true,
      provider: "LOCAL",
    };
    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      mockUser
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "a",
      newRefreshToken: "r",
    });
    (authRepository.updateUserToken as jest.Mock).mockResolvedValue(undefined);

    await authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER");

    expect(validateUserSignupInput).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@test.com", password: "1rhdiddl!" })
    );
  });

  it("encryptedPassword 누락이면 AuthenticationError(401)", async () => {
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      email: "test@test.com",
      encryptedPassword: null,
      provider: "LOCAL",
    } as any;

    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      mockUser
    );

    await expect(
      authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(AuthenticationError);
  });

  it("타입 병합이 필요 없으면 원본 userType으로 updateUserToken 호출", async () => {
    const mockUser = {
      id: 7,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      email: "t@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      isCustomer: true,
      isMover: true,
      provider: "LOCAL",
    };

    (authRepository.findUserByEmailAndPassword as jest.Mock).mockResolvedValue(
      mockUser
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "a",
      newRefreshToken: "r",
    });
    const mockUpdate = authRepository.updateUserToken as jest.Mock;
    mockUpdate.mockResolvedValue(undefined);

    await authService.signin("t@test.com", "1rhdiddl!", "CUSTOMER");

    expect(mockUpdate).toHaveBeenCalledWith(
      String(mockUser.id),
      "r",
      mockUser.userType
    );
  });
});

describe("authService.logout", () => {
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("로그아웃 성공", async () => {
    // Setup
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      email: "test@test.com",
      encryptedPassword: "$2b$10$hashedpassword",
      customerImage: "https://cdn.com/image.png",
      moverImage: null,
      isCustomer: true,
      isMover: false,
      refreshToken: "mockRefreshToken",
    };

    const mockFindUserById = authRepository.findUserById as jest.Mock;
    mockFindUserById.mockResolvedValue(mockUser);

    // Exercise
    const result = await authService.logout(mockUser.id.toString());

    // Assertion
    expect(result).toBeUndefined();
    expect(mockFindUserById).toHaveBeenCalledWith(mockUser.id.toString());
  });

  it("로그아웃 실패 - 존재하지 않는 유저 라면 NotFoundError(404) 발생", async () => {
    // Setup
    const mockFindUserById = authRepository.findUserById as jest.Mock;
    mockFindUserById.mockResolvedValue(null);

    // Exercise
    await expect(authService.logout("1")).rejects.toThrow(NotFoundError);
    await expect(authService.logout("1")).rejects.toThrow(
      "존재하지 않는 유저입니다"
    );
  });

  it("로그아웃 시 updateUserToken이 null로 호출되어 리프레시 토큰 무효화", async () => {
    const mockUser = { id: 10, name: "홍길동", userType: ["CUSTOMER"] } as any;
    (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (authRepository.updateUserToken as jest.Mock).mockResolvedValue(undefined);

    await authService.logout("10");
    expect(authRepository.updateUserToken).toHaveBeenCalledWith(
      "10",
      null,
      mockUser.userType
    );
  });

  it("userId 미제공 시 AuthenticationError 메시지 포함", async () => {
    await expect(authService.logout("")).rejects.toThrow(AuthenticationError);
    await expect(authService.logout("")).rejects.toThrow("토큰 인증 실패");
  });
});

describe("authService.refresh", () => {
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("토큰 갱신 성공 - refreshToken 재발급 없이 accessToken만 반환", async () => {
    // Setup
    const mockDecodedToken = {
      userId: "1",
      userType: "CUSTOMER" as TUserRole,
      exp: Math.floor(Date.now() / 1000) + 6 * 24 * 60 * 60, // 만료까지 6일 → 재발급 안됨
    };

    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
    };

    const mockFindUserById = authRepository.findUserById as jest.Mock;
    mockFindUserById.mockResolvedValue(mockUser);

    const mockGenerateAccessToken = generateAccessToken as jest.Mock;
    mockGenerateAccessToken.mockReturnValue("mockAccessToken");

    // Exercise
    const result = await authService.refresh(mockDecodedToken);

    // Assertion
    expect(result).toMatchObject({
      accessToken: "mockAccessToken",
      refreshToken: undefined,
    });
  });

  it("토큰 갱신 성공 - refreshToken 만료 임박 시 둘 다 재발급", async () => {
    // Setup
    const mockDecodedToken = {
      userId: "1",
      userType: "CUSTOMER" as TUserRole,
      exp: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60, // 만료까지 2일 → 재발급 조건 충족
    };

    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
    };

    const mockFindUserById = authRepository.findUserById as jest.Mock;
    mockFindUserById.mockResolvedValue(mockUser);

    const mockGenerateAccessToken = generateAccessToken as jest.Mock;
    mockGenerateAccessToken.mockReturnValue("mockAccessToken");

    const mockGenerateRefreshToken = generateRefreshToken as jest.Mock;
    mockGenerateRefreshToken.mockReturnValue("mockRefreshToken");

    const mockUpdateUserToken = authRepository.updateUserToken as jest.Mock;
    mockUpdateUserToken.mockResolvedValue(undefined);

    // Exercise
    const result = await authService.refresh(mockDecodedToken);

    // Assertion
    expect(result).toMatchObject({
      accessToken: "mockAccessToken",
      refreshToken: "mockRefreshToken",
    });
  });

  it("유저가 없으면 NotFoundError(404)", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(null);
    await expect(
      authService.refresh({ userId: "1", userType: "CUSTOMER", exp: 0 })
    ).rejects.toThrow(NotFoundError);
  });

  it("임계치 초과(재발급 안함)일 때 updateUserToken 호출 안됨", async () => {
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
    };
    (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (generateAccessToken as jest.Mock).mockReturnValue("access");

    const now = Math.floor(Date.now() / 1000);
    const decoded = {
      userId: "1",
      userType: "CUSTOMER" as TUserRole,
      exp: now + 6 * 24 * 60 * 60,
    };

    await authService.refresh(decoded);
    expect(authRepository.updateUserToken).not.toHaveBeenCalled();
  });

  it("임계 경계값(=5일)에서는 재발급 및 updateUserToken 호출", async () => {
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
    };
    (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (generateAccessToken as jest.Mock).mockReturnValue("access");
    (generateRefreshToken as jest.Mock).mockReturnValue("refresh");
    (authRepository.updateUserToken as jest.Mock).mockResolvedValue(undefined);

    const now = Math.floor(Date.now() / 1000);
    const threshold = 5 * 24 * 60 * 60; // seconds
    const decoded = {
      userId: "1",
      userType: "CUSTOMER" as TUserRole,
      exp: now + threshold,
    };

    const result = await authService.refresh(decoded);
    expect(result).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
    });
    expect(authRepository.updateUserToken).toHaveBeenCalledWith(
      mockUser.id,
      "refresh",
      mockUser.userType
    );
  });

  it("accessToken 생성 실패(reject) 시 에러 전파", async () => {
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
    };
    (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (generateAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error("token error");
    });

    const now = Math.floor(Date.now() / 1000);
    await expect(
      authService.refresh({ userId: "1", userType: "CUSTOMER", exp: now + 10 })
    ).rejects.toThrow(/token error/);
  });

  it("반환 객체에 provider가 포함되는지 확인", async () => {
    const mockDecodedToken = {
      userId: "1",
      userType: "CUSTOMER" as TUserRole,
      exp: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60,
    };
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
      provider: "LOCAL",
    };
    (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (generateAccessToken as jest.Mock).mockReturnValue("mockAccessToken");
    (generateRefreshToken as jest.Mock).mockReturnValue("mockRefreshToken");

    const result = await authService.refresh(mockDecodedToken);
    expect(result.provider).toBe("LOCAL");
  });
});

describe("authService.switchRole", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("성공: 토큰 재발급 및 updateUserToken 호출", async () => {
    const mockUser = {
      id: 3,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
      isMover: false,
      provider: "LOCAL",
    };
    (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "access",
      newRefreshToken: "refresh",
    });
    const mockUpdate = authRepository.updateUserToken as jest.Mock;
    mockUpdate.mockResolvedValue(undefined);

    const result = await authService.switchRole("3", "MOVER");

    expect(result).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      provider: "LOCAL",
    });
    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({ hasProfile: false, userType: "MOVER" })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      String(mockUser.id),
      "refresh",
      mockUser.userType
    );
  });

  it("유저 없음 → NotFoundError", async () => {
    (authRepository.findUserById as jest.Mock).mockResolvedValue(null);
    await expect(authService.switchRole("99", "CUSTOMER")).rejects.toThrow(
      NotFoundError
    );
  });

  it("토큰 생성 실패 → ServerError", async () => {
    const mockUser = {
      id: 4,
      name: "홍길동",
      userType: ["CUSTOMER"],
      isCustomer: true,
      isMover: false,
      provider: "LOCAL",
    };
    (authRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: null,
      newRefreshToken: null,
    });

    await expect(authService.switchRole("4", "MOVER")).rejects.toThrow(
      ServerError
    );
  });
});

describe("authService.oauthCrateOrUpdate - 보강", () => {
  afterEach(() => jest.clearAllMocks());

  it("기존 유저 경로에서 updateUserToken 호출 및 hasProfile 맵핑 확인", async () => {
    const mockUser = {
      id: 5,
      name: "홍길동",
      userType: ["CUSTOMER"],
      nickname: "길동이",
      provider: "GOOGLE",
      isCustomer: true,
      isMover: false,
    };
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (authUtils.mergeUserTypes as jest.Mock).mockReturnValue([
      "CUSTOMER",
      "MOVER",
    ]);
    (authRepository.updateUser as jest.Mock).mockResolvedValue({
      ...mockUser,
      userType: ["CUSTOMER", "MOVER"],
    });
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "a",
      newRefreshToken: "r",
    });
    const mockUpdate = authRepository.updateUserToken as jest.Mock;
    mockUpdate.mockResolvedValue(undefined);

    await authService.oauthCrateOrUpdate(
      "GOOGLE",
      "pid",
      "g@test.com",
      "홍길동",
      "MOVER"
    );

    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({ userType: "MOVER", hasProfile: false })
    );
    expect(mockUpdate).toHaveBeenCalledWith(String(mockUser.id), "r");
  });
});

describe("authService.oauthCrateOrUpdate", () => {
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("기존 소셜 유저가 있는 경우 - 업데이트 후 토큰 반환", async () => {
    // Setup
    const mockUser = {
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER"],
      nickname: "길동이",
      provider: "GOOGLE",
      isCustomer: true,
      isMover: false,
    };

    const mockUpdatedUser = {
      ...mockUser,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
    };

    // 기존 유저가 있는 경우
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
    (authUtils.mergeUserTypes as jest.Mock).mockReturnValue([
      "CUSTOMER",
      "MOVER",
    ]);
    (authRepository.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "access_token",
      newRefreshToken: "refresh_token",
    });
    (authRepository.updateUserToken as jest.Mock).mockResolvedValue(undefined);

    // Exercise
    const result = await authService.oauthCrateOrUpdate(
      "GOOGLE",
      "provider-id-123",
      "test@example.com",
      "홍길동",
      "MOVER"
    );

    // Assert
    expect(result).toMatchObject({
      id: 1,
      name: "홍길동",
      userType: ["CUSTOMER", "MOVER"],
      nickname: "길동이",
      provider: "GOOGLE",
      accessToken: "access_token",
      refreshToken: "refresh_token",
    });
  });

  it("기존 소셜 유저가 없는 경우 - 생성 후 토큰 반환", async () => {
    // Setup
    const mockCreatedUser = {
      id: 2,
      name: "이몽룡",
      userType: ["CUSTOMER"],
      nickname: "몽룡",
      provider: "NAVER",
    };

    // 기존 유저가 null인 경우
    (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (authRepository.createSocialUser as jest.Mock).mockResolvedValue(
      mockCreatedUser
    );
    (generateToken as jest.Mock).mockReturnValue({
      newAccessToken: "access_token",
      newRefreshToken: "refresh_token",
    });

    // Exercise
    const result = await authService.oauthCrateOrUpdate(
      "NAVER",
      "provider-id-456",
      "lee@example.com",
      "이몽룡",
      "CUSTOMER"
    );

    // Assert
    expect(result).toMatchObject({
      id: 2,
      name: "이몽룡",
      userType: ["CUSTOMER"],
      nickname: "몽룡",
      provider: "NAVER",
      accessToken: "access_token",
      refreshToken: "refresh_token",
    });
  });
});

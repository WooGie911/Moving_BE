import bcrypt from "bcrypt";
import authRepository from "../repositories/auth.repository";
import { generateToken } from "../utils/generateToken";
import authService from "./auth.service";
import {
  AuthenticationError,
  DatabaseError,
  ServerError,
  ValidationError,
} from "../types/commonError.types";
import { TUserRole } from "../types/user.types";
import { validateUserSignupInput } from "../utils/validators/userValidator";

jest.mock("../repositories/auth.repository");
jest.mock("bcrypt");
jest.mock("../utils/generateToken");
jest.mock("../utils/validators/userValidator");

describe("authService.signup", () => {
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("CUSTOMER 회원가입 성공", async () => {
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

  test("MOVER 회원가입 성공", async () => {
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

  test("회원가입 실패 - 이메일 중복 ValidationError(422) 발생", async () => {
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

  test("회원가입 실패 - 잘못된 이메일 형식이면 ValidationError(422) 발생", async () => {
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

  test("회원가입 실패 - 잘못된 비밀번호 형식이면 ValidationError(422) 발생", async () => {
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

  test("회원가입 실패 - 잘못된 이름 형식이면 ValidationError(422) 발생", async () => {
    // 💡 validateUserSignupInput 직접 throw 시뮬레이션
    const mockFindUserByEmail = authRepository.findUserByEmail as jest.Mock;
    mockFindUserByEmail.mockResolvedValue(null); // 중복 아님

    const mockValidateUserSignupInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSignupInput.mockImplementation(() => {
      throw new ValidationError("올바른 이름 형식이 아닙니다.");
    });

    /**
     * 이름 유효성 검사
     * - 한글, 영문, 공백 허용
     * 최소 2자이상
     * 최대 10자 이하
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

  test("회원가입 실패 - 잘못된 전화번호 형식이면 ValidationError(422) 발생", async () => {
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

  test("회원가입 실패 - 유저 생성 실패시 DatabaseError(500) 발생", async () => {
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

  test("회원가입 실패 - 토큰 생성 실패시 ServerError(500) 발생", async () => {
    // Setup
    const mockUser = {
      id: 1,
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
});

describe("authService.signin", () => {
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("CUSTOMER 로그인 성공", async () => {
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

  test("MOVER 로그인 성공", async () => {
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

  test("로그인 실패 - 잘못된 이메일 형식이면 ValidationError(422) 발생", async () => {
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

  test("로그인 실패 - 잘못된 비밀번호 형식이면 ValidationError(422) 발생", async () => {
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

  test("로그인 실패 - 존재하지 않는 유저 라면 AuthenticationError(401) 발생", async () => {
    // Setup
    const mockValidateUserSigninInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSigninInput.mockImplementation(() => {
      throw new AuthenticationError("존재하지 않는 유저입니다.");
    });

    // Assertion
    await expect(
      authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(AuthenticationError);
  });

  test("로그인 실패 - 비밀번호 불일치 라면 AuthenticationError(401) 발생", async () => {
    // Setup
    const mockValidateUserSigninInput = validateUserSignupInput as jest.Mock;
    mockValidateUserSigninInput.mockImplementation(() => {
      throw new AuthenticationError("비밀번호가 일치하지 않습니다.");
    });

    // Assertion
    await expect(
      authService.signin("test@test.com", "1rhdiddl!", "CUSTOMER")
    ).rejects.toThrow(AuthenticationError);
  });

  test("로그인 실패 - 토큰 생성 실패시 ServerError(500) 발생", async () => {
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
});

import authRepository from "../repositories/auth.repository";
import actionService from "./action.service";
import { ActionType } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
} from "../utils/generateToken";
import { TUserRole, TUserSignupInput } from "../types/user.types";
import { encryptPhoneNumber } from "../utils/phoneEncryption";
import { validateUserSignupInput } from "../utils/validators/userValidator";
import {
  AuthenticationError,
  DatabaseError,
  NotFoundError,
  ServerError,
  ValidationError,
} from "../types/commonError.types";
import { REFRESH_TOKEN_REISSUE_THRESHOLD_SECONDS } from "../constants/token.constants";
import { AuthProvider } from "@prisma/client";
import { mergeUserTypes } from "../utils/authUtils";

type TDecodedToken = {
  userId: string;
  userType: TUserRole;
  exp: number;
};

// 로그인 검증
const signin = async (email: string, password: string, userType: TUserRole) => {
  try {
    // 0. 유효성 검사
    validateUserSignupInput({ email, password });

    // 1. 유저 존재 여부 확인
    const existingUser = await authRepository.findUserByEmailAndPassword(email);

    if (!existingUser) {
      throw new AuthenticationError("존재하지 않는 유저입니다");
    }

    // 2. 소셜 로그인 유저 확인
    if (existingUser.provider !== "LOCAL") {
      throw new AuthenticationError(
        "소셜 로그인 유저입니다. 소셜로그인으로 로그인 해주세요"
      );
    }

    // 3. 비밀번호 검증
    if (
      !existingUser.encryptedPassword ||
      !(await bcrypt.compare(password, existingUser.encryptedPassword))
    ) {
      throw new AuthenticationError("비밀번호가 일치하지 않습니다");
    }

    let accessToken, refreshToken;
    // 4. 유저 role에 따른 토큰 생성
    if (userType === "CUSTOMER") {
      const { newAccessToken, newRefreshToken } = generateToken({
        id: String(existingUser.id),
        name: existingUser.name,
        userType,
        hasProfile: existingUser.isCustomer || false,
      });

      accessToken = newAccessToken;
      refreshToken = newRefreshToken;
    } else if (userType === "MOVER") {
      const { newAccessToken, newRefreshToken } = generateToken({
        id: String(existingUser.id),
        name: existingUser.name,
        userType,
        hasProfile: existingUser.isMover || false,
      });

      accessToken = newAccessToken;
      refreshToken = newRefreshToken;
    }

    if (!accessToken || !refreshToken) {
      throw new ServerError("토큰 생성 실패로 인한 로그인 실패");
    }

    // 현재 유저 타입이 1개이고, MOVER 이고 원본이 "CUSTOMER" 만 존재한다면 배열에 추가 "MOVER" 타입을 추가
    let currentType = [];
    if (
      existingUser.userType?.[0] === "CUSTOMER" &&
      existingUser.userType.length === 1 &&
      userType === "MOVER"
    ) {
      currentType = [existingUser.userType[0], userType];
    } else {
      // 아니라면 원본 유저 타입 그대로 사용
      // (첫 크로스 로그인 이후로는 아래만 실행됨)
      currentType = existingUser.userType;
    }

    await authRepository.updateUserToken(
      String(existingUser.id),
      refreshToken,
      currentType as TUserRole[]
    );

    return {
      id: existingUser.id,
      userName: existingUser.name,
      userType,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("인증 서비스 에러:", error);
    console.error("에러 상세 정보:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown",
    });
    throw error;
  }
};

// 회원가입 검증
const signup = async ({
  name,
  email,
  phoneNumber,
  password,
  userType,
}: TUserSignupInput) => {
  // email 중복 체크
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw new ValidationError("이미 사용 중인 이메일입니다.");
  }

  // name, email, phoneNumber, password 유효성 검사
  validateUserSignupInput({ name, email, phoneNumber, password });

  // 비밀번호 암호화
  const encryptedPassword = await bcrypt.hash(password, 10);

  // 전화번호 암호화
  const encryptedPhoneNumber = encryptPhoneNumber(phoneNumber);

  // 유저 생성
  const user = await authRepository.createUser({
    name,
    email,
    encryptedPassword,
    encryptedPhoneNumber,
    userType,
  });

  if (!user) {
    throw new DatabaseError("유저 생성 실패로 인한 회원가입 실패");
  }

  // WELCOME 액션 생성
  await actionService.createAction(
    user.id,
    ActionType.WELCOME,
    user.id,
    "USER",
    {}
  );

  let accessToken, refreshToken;

  // 유저 타입 배열에 CUSTOMER가 먼저 있는지 확인 없다면 현재 타입은 MOVER
  // (저장 순서가  CUSTOMER, MOVER 이므로)
  const userTypeResponse = user.userType.some((type) => type === "CUSTOMER")
    ? "CUSTOMER"
    : "MOVER";

  // 3. 현재 유저 타입에 맞는 토큰 생성
  // hasProfile은 프로필 등록 여부를 판단하기 위해 사용
  if (userType === "CUSTOMER") {
    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(user.id),
      name: user.name,
      userType: userTypeResponse,
      hasProfile: false,
    });

    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
  } else if (userType === "MOVER") {
    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(user.id),
      name: user.name,
      userType: userTypeResponse,
      hasProfile: false,
    });

    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
  }

  if (!accessToken || !refreshToken) {
    throw new ServerError("토큰 생성 실패로 인한 회원가입 실패");
  }

  return {
    id: user.id,
    userName: user.name,
    userType,
    accessToken,
    refreshToken,
  };
};

// 로그아웃
const logout = async (userId: string) => {
  if (!userId) {
    throw new AuthenticationError("토큰 인증 실패");
  }

  const user = await authRepository.findUserById(String(userId));

  if (!user) {
    throw new NotFoundError("존재하지 않는 유저입니다");
  }

  await authRepository.updateUserToken(String(userId), null, user.userType);
};

// 역할 변경
const switchRole = async (userId: string, userType: TUserRole) => {
  const user = await authRepository.findUserById(String(userId));

  if (!user) {
    throw new NotFoundError("존재하지 않는 유저입니다");
  }

  const { newAccessToken, newRefreshToken } = generateToken({
    id: String(user.id),
    name: user.name,
    userType: userType,
    hasProfile:
      userType === "CUSTOMER"
        ? user.isCustomer || false
        : user.isMover || false,
  });

  if (!newAccessToken || !newRefreshToken) {
    throw new ServerError("유저 변환중 오류가 발생했습니다");
  }

  await authRepository.updateUserToken(
    String(user.id),
    newRefreshToken,
    user.userType
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    provider: user.provider,
  };
};

// JWT 슬라이딩 세션 토큰 갱신
const refresh = async (decoded: TDecodedToken) => {
  const user = await authRepository.findUserById(decoded.userId);
  if (!user) throw new NotFoundError("존재하지 않는 유저입니다");

  const now = Date.now() / 1000;
  const refreshExp = decoded.exp;

  const accessToken = generateAccessToken({
    id: user.id,
    name: user.name,
    userType: decoded.userType,
    hasProfile:
      decoded.userType === "CUSTOMER"
        ? user.isCustomer || false
        : user.isMover || false,
  });

  let refreshToken = undefined;
  // 만료 시간이 5일 이하라면 리프레쉬 토큰 재발급
  if (refreshExp - now <= REFRESH_TOKEN_REISSUE_THRESHOLD_SECONDS) {
    refreshToken = generateRefreshToken({
      id: user.id,
      name: user.name,
      userType: decoded.userType,
      hasProfile:
        decoded.userType === "CUSTOMER"
          ? user.isCustomer || false
          : user.isMover || false,
    });

    await authRepository.updateUserToken(
      user.id,
      refreshToken || null,
      user.userType
    );
  }

  // refreshToken은 optional
  return { accessToken, refreshToken, provider: user.provider };
};

// 소셜 로그인
const oauthCrateOrUpdate = async (
  provider: AuthProvider,
  providerId: string,
  email: string,
  name: string,
  userType: TUserRole
) => {
  const existingUser = await authRepository.findUserByEmail(email);

  // 유저 정보가 있으면 업데이트
  if (existingUser) {
    // 현재 유저 타입 배열과 받아온 유저 타입을 병합
    const currentType = mergeUserTypes(existingUser.userType, userType);

    const updatedUser = await authRepository.updateUser(
      existingUser.id,
      provider,
      providerId,
      currentType,
      name // name도 업데이트
    );

    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(updatedUser.id),
      name: updatedUser.name,
      userType,
      hasProfile:
        userType === "CUSTOMER"
          ? updatedUser.isCustomer || false
          : updatedUser.isMover || false,
    });

    await authRepository.updateUserToken(
      String(updatedUser.id),
      newRefreshToken
    );

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      userType: updatedUser.userType,
      nickname: updatedUser.nickname,
      provider: updatedUser.provider,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } else {
    const createdUser = await authRepository.createSocialUser({
      email,
      name,
      provider,
      providerId,
      userType,
    });

    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(createdUser.id),
      name: createdUser.name,
      userType,
      hasProfile: false,
    });

    return {
      id: createdUser.id,
      name: createdUser.name,
      userType: createdUser.userType,
      nickname: createdUser.nickname,
      provider: createdUser.provider,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
};

export default {
  signin,
  signup,
  logout,
  switchRole,
  refresh,
  oauthCrateOrUpdate,
};

import authRepository from "../repositories/auth.repository";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken";
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

// 로그인 검증
const signin = async (email: string, password: string, userType: TUserRole) => {
  // 0. 유효성 검사
  validateUserSignupInput({ email, password });

  // 1. 유저 존재 여부 확인
  const existingUser = await authRepository.findUserByEmailAndPassword(email);

  if (!existingUser) {
    throw new AuthenticationError("존재하지 않는 유저입니다");
  }
  // 2. 비밀번호 검증
  if (
    !existingUser.encryptedPassword ||
    !(await bcrypt.compare(password, existingUser.encryptedPassword))
  ) {
    throw new AuthenticationError("비밀번호가 일치하지 않습니다");
  }

  let accessToken, refreshToken;

  // 3. 유저 role에 따른 토큰 생성
  if (userType === "CUSTOMER") {
    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(existingUser.id),
      name: existingUser.name,
      userType,
    });

    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
  } else if (userType === "MOVER") {
    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(existingUser.id),
      name: existingUser.name,
      userType,
    });

    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
  }

  if (!accessToken || !refreshToken) {
    throw new ServerError("토큰 생성 실패로 인한 로그인 실패");
  }

  await authRepository.updateUserToken(String(existingUser.id), refreshToken);

  return {
    id: existingUser.id,
    userName: existingUser.name,
    userType: userType === "CUSTOMER" ? "CUSTOMER" : "MOVER",
    accessToken,
    refreshToken,
  };
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
  const user = await authRepository.saveUser({
    name,
    email,
    encryptedPassword,
    encryptedPhoneNumber,
    userType,
  });

  if (!user) {
    throw new DatabaseError("유저 생성 실패로 인한 회원가입 실패");
  }

  let accessToken, refreshToken;

  // 3. 토큰 생성
  if (userType === "CUSTOMER") {
    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(user.id),
      name: user.name,
      userType: user.userType[0],
    });

    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
  } else if (userType === "MOVER") {
    const { newAccessToken, newRefreshToken } = generateToken({
      id: String(user.id),
      name: user.name,
      userType: user.userType[0],
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
    userType: userType === "CUSTOMER" ? "CUSTOMER" : "MOVER",
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

  if (!user.refreshToken) {
    throw new AuthenticationError("이미 로그아웃된 상태입니다");
  }

  await authRepository.updateUserToken(String(userId), null);
};

export default { signin, signup, logout };

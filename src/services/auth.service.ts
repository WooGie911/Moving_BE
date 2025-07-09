import authRepository from "../repositories/auth.repository";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import { TUserSignupInput } from "../types/user";
import { encryptPhoneNumber } from "../utils/phoneEncryption";
import { validateUserSignupInput } from "../utils/validators/userValidator";
import {
  AuthenticationError,
  DatabaseError,
  ServerError,
  ValidationError,
} from "../types/commonError";

// 로그인 검증
const signin = async (email: string, password: string) => {
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

  // 3. 토큰 생성
  const accessToken = generateAccessToken({
    id: existingUser.id,
    name: existingUser.name,
    currentRole: existingUser.currentRole,
  });

  const refreshToken = generateRefreshToken({
    id: existingUser.id,
    name: existingUser.name,
    currentRole: existingUser.currentRole,
  });

  if (!accessToken || !refreshToken) {
    throw new ServerError("토큰 생성 실패로 인한 로그인 실패");
  }

  return {
    id: existingUser.id,
    name: existingUser.name,
    currentRole: existingUser.currentRole,
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
  currentRole,
}: TUserSignupInput) => {
  // email 중복 체크
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw new ValidationError("이미 존재하는 이메일입니다");
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
    currentRole,
  });

  if (!user) {
    throw new DatabaseError("유저 생성 실패로 인한 회원가입 실패");
  }

  // 3. 토큰 생성
  const accessToken = generateAccessToken({
    id: user.id,
    name: user.name,
    currentRole: user.currentRole,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    name: user.name,
    currentRole: user.currentRole,
  });

  if (!accessToken || !refreshToken) {
    throw new ServerError("토큰 생성 실패로 인한 회원가입 실패");
  }

  return { accessToken, refreshToken };
};

export default { signin, signup };

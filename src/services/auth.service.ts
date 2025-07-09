import authRepository from "../repositories/auth.repository";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";

// 로그인 검증
const signin = async (email: string, password: string) => {
  // 1. 유저 존재 여부 확인
  const existingUser = await authRepository.findUserByEmailAndPassword(email);

  if (!existingUser) {
    throw new Error("존재하지 않는 유저입니다");
  }

  // 2. 비밀번호 검증
  if (
    !existingUser.encryptedPassword ||
    !(await bcrypt.compare(password, existingUser.encryptedPassword))
  ) {
    throw new Error("비밀번호가 일치하지 않습니다");
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

  return { user: existingUser, accessToken, refreshToken };
};

export default { signin };

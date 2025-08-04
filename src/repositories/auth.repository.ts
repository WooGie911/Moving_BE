import { AuthProvider } from "@prisma/client";
import prisma from "../db/prisma/prisma";
import { TSocialSignupInput, TUserRole, TUserSignup } from "../types/user.types";

// 유저 생성
const createUser = async (user: TUserSignup) => {
  return await prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      encryptedPassword: user.encryptedPassword,
      encryptedPhoneNumber: user.encryptedPhoneNumber,
      userType: [user.userType],
    },
    select: {
      id: true,
      name: true,
      userType: true,
      nickname: true,
    },
  });
};

// 소셜 로그인 유저 생성
const createSocialUser = async (user: TSocialSignupInput) => {
  return await prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      userType: [user.userType],
      provider: user.provider,
      providerId: user.providerId,
    },
    select: {
      id: true,
      name: true,
      userType: true,
      nickname: true,
      provider: true,
    },
  });
};

// 로그인 검증용 로직
const findUserByEmailAndPassword = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      userType: true,
      email: true,
      encryptedPassword: true,
      customerImage: true,
      moverImage: true,
      isCustomer: true,
      isMover: true,
      provider: true,
    },
  });
};

// 이메일 중복 체크
const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

// 로그인에 따른 유저 토큰 업데이트
const updateUserToken = async (userId: string, refreshToken: string | null, userType?: TUserRole[]) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { refreshToken, userType },
  });
};

// 유저 조회
const findUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};

// 유저 업데이트
const updateUser = async (
  userId: string,
  provider: AuthProvider,
  providerId: string,
  userType?: TUserRole[],
  name?: string,
) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      provider,
      providerId,
      userType,
      ...(name && { name }), // name이 있으면 업데이트
    },
    select: {
      id: true,
      name: true,
      userType: true,
      nickname: true,
      provider: true,
      isCustomer: true,
      isMover: true,
    },
  });
};

export default {
  createUser,
  findUserByEmailAndPassword,
  findUserByEmail,
  updateUserToken,
  findUserById,
  updateUser,
  createSocialUser,
};

import { PrismaClient } from "@prisma/client";
import { TUserSignup } from "../types/user.types";

const prisma = new PrismaClient();

const saveUser = async (user: TUserSignup) => {
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
      nickname: true,
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
const updateUserToken = async (userId: string, refreshToken: string | null) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { refreshToken },
  });
};

// 유저 조회
const findUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};

export default {
  saveUser,
  findUserByEmailAndPassword,
  findUserByEmail,
  updateUserToken,
  findUserById,
};

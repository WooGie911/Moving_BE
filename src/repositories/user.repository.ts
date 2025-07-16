import { PrismaClient } from "@prisma/client";
import {
  TUserProfile,
  TCreateMoverProfile,
  TUpdateCustomerUser,
} from "../types/user.types";

const prisma = new PrismaClient();

const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      currentRole: true,
      accessToken: true,
      hasProfile: true,
    },
  });
  return user;
};

// 일반 유저(CUSTOMER) 정보 업데이트 및 서비스 등록
const updateCustomerUser = async (
  userId: number,
  userData: TUpdateCustomerUser,
  serviceIds: number[]
) => {
  return await prisma.$transaction(async (tx) => {
    // 유저 정보 업데이트
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        currentRegion: userData.currentRegion as any, // Region enum
        hasProfile: userData.hasProfile,
      },
    });

    // 기존 유저 서비스 삭제
    await tx.userService.deleteMany({
      where: { userId },
    });

    // 새로운 유저 서비스 등록
    if (serviceIds.length > 0) {
      await tx.userService.createMany({
        data: serviceIds.map((serviceId) => ({
          userId,
          serviceId,
        })),
      });
    }

    return updatedUser;
  });
};

// 기사님(MOVER) 프로필 생성
const createMoverProfile = async (
  profileData: TCreateMoverProfile,
  regionIds: string[],
  serviceIds: number[]
) => {
  return await prisma.$transaction(async (tx) => {
    // 프로필 생성
    const profile = await tx.profile.create({
      data: {
        userId: profileData.userId,
        nickname: profileData.nickname,
        profileImage: profileData.profileImage,
        experience: profileData.experience,
        introduction: profileData.introduction,
        description: profileData.description,
      },
    });

    // 서비스 지역 등록
    if (regionIds.length > 0) {
      await tx.profileRegion.createMany({
        data: regionIds.map((region) => ({
          profileId: profile.id,
          region: region as any, // Region enum
        })),
      });
    }

    // 서비스 타입 등록
    if (serviceIds.length > 0) {
      await tx.profileService.createMany({
        data: serviceIds.map((serviceId) => ({
          profileId: profile.id,
          serviceId,
        })),
      });
    }

    // 유저의 hasProfile을 true로 업데이트
    await tx.user.update({
      where: { id: profileData.userId },
      data: { hasProfile: true },
    });

    return profile;
  });
};

// 프로필 존재 여부 확인
const checkProfileExists = async (userId: number) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });
  return !!profile;
};

// 닉네임 중복 확인
const checkNicknameExists = async (nickname: string) => {
  const profile = await prisma.profile.findUnique({
    where: { nickname },
  });
  return !!profile;
};

export {
  getUserById,
  updateCustomerUser,
  createMoverProfile,
  checkProfileExists,
  checkNicknameExists,
};

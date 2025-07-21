import { PrismaClient } from "@prisma/client";
import {
  TCreateMoverProfile,
  TUpdateCustomerUser,
  TCreateCustomerProfile,
  TUpdateUserProfile,
  TServiceId,
  RegionType,
  MoveType,
} from "../types/user.types";

const prisma = new PrismaClient();

// 사용자 정보 조회
const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      encryptedPhoneNumber: true,
      currentArea: true,
      preferredServices: true,
      nickname: true,
      customerImage: true,
      moverImage: true,
      userType: true,
      refreshToken: true,
    },
  });
  return user;
};

// 사용자 정보 조회 (비밀번호 포함)
const getUserWithPassword = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      encryptedPassword: true,
      currentArea: true,
      userType: true,
    },
  });
  return user;
};

// 일반 유저(CUSTOMER) 프로필 생성 및 유저 정보 업데이트
const createCustomerProfile = async (profileData: TCreateCustomerProfile) => {
  return await prisma.user.update({
    where: { id: profileData.userId },
    data: {
      customerImage: profileData.customerImage,
      currentArea: profileData.currentArea,
      preferredServices: profileData.preferredServices,
      nickname: profileData.nickname,
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      customerImage: true,
      currentArea: true,
      preferredServices: true,
    },
  });
};

// 기사님(MOVER) 프로필 생성
const createMoverProfile = async (profileData: TCreateMoverProfile) => {
  return await prisma.user.update({
    where: { id: profileData.userId },
    data: {
      nickname: profileData.nickname,
      moverImage: profileData.profileImage,
      career: profileData.experience,
      shortIntro: profileData.introduction,
      detailIntro: profileData.description,
      serviceTypes: profileData.serviceTypes,
      currentArea: profileData.currentArea,
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      moverImage: true,
      career: true,
      shortIntro: true,
      detailIntro: true,
      serviceTypes: true,
    },
  });
};

// 닉네임 중복 확인
const checkNicknameExists = async (nickname: string) => {
  const user = await prisma.user.findUnique({
    where: { nickname },
  });
  return !!user;
};

// 사용자 프로필 업데이트
const updateUserProfile = async (
  userId: string,
  updateData: TUpdateUserProfile,
  serviceIds?: TServiceId[]
) => {
  // 업데이트할 데이터 준비
  const updateFields: any = {};

  if (updateData.name !== undefined) {
    updateFields.name = updateData.name;
  }
  if (updateData.encryptedPhoneNumber !== undefined) {
    updateFields.encryptedPhoneNumber = updateData.encryptedPhoneNumber;
  }
  if (updateData.encryptedPassword !== undefined) {
    updateFields.encryptedPassword = updateData.encryptedPassword;
  }
  if (updateData.currentRegion !== undefined) {
    updateFields.currentArea = updateData.currentRegion as RegionType;
  }
  if (updateData.profileImage !== undefined) {
    // 사용자 타입에 따라 다른 이미지 필드 사용
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });

    if (user?.userType.includes("CUSTOMER")) {
      updateFields.customerImage = updateData.profileImage;
    }
    if (user?.userType.includes("MOVER")) {
      updateFields.moverImage = updateData.profileImage;
    }
  }

  // 서비스 타입 업데이트
  if (serviceIds !== undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });

    const moveTypes = serviceIds.map((id) => {
      switch (id) {
        case 1:
          return "SMALL" as MoveType;
        case 2:
          return "HOME" as MoveType;
        case 3:
          return "OFFICE" as MoveType;
        default:
          return "SMALL" as MoveType;
      }
    });

    if (user?.userType.includes("CUSTOMER")) {
      updateFields.preferredServices = moveTypes;
    }
    if (user?.userType.includes("MOVER")) {
      updateFields.serviceTypes = moveTypes;
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data: updateFields,
    select: {
      id: true,
      name: true,
      nickname: true,
      customerImage: true,
      moverImage: true,
      currentArea: true,
      preferredServices: true,
      serviceTypes: true,
      userType: true,
    },
  });
};

export {
  getUserById,
  getUserWithPassword,
  createCustomerProfile,
  createMoverProfile as createMoverProfileRepository,
  updateUserProfile,
  checkNicknameExists,
};

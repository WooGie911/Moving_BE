import { Request, Response } from "express";
import {
  userInfo,
  createCustomerProfile,
  createMoverProfile,
  updateCustomerProfile,
} from "../services/user.service";
import { handleError } from "../utils/handleError";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TUserProfileUpdateInput,
  TUserRole,
} from "../types/user.types";
import {
  PROFILE_SUCCESS_MESSAGES,
  PROFILE_ERROR_MESSAGES,
} from "../constants/profile.constants";

const getUser = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: number };

  const user = await userInfo(userId);

  res.json({ success: true, data: user });
};

// 유저 프로필 등록(role별 분기 처리)
const postUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as {
      userId: number;
      role: TUserRole;
    };

    if (role === "CUSTOMER") {
      // 일반 유저 프로필 등록
      const profileData: TCustomerProfileInput = {
        profileImage: req.body.profileImage,
        currentRegion: req.body.currentRegion,
        userServices: req.body.userServices,
      };

      const result = await createCustomerProfile(userId, profileData);
      res.json({
        success: true,
        message: PROFILE_SUCCESS_MESSAGES.CUSTOMER_PROFILE_CREATED,
        data: result,
      });
    } else if (role === "MOVER") {
      // 기사님 프로필 등록
      const profileData: TMoverProfileInput = {
        profileImage: req.body.profileImage,
        nickname: req.body.nickname,
        experience: req.body.experience,
        introduction: req.body.introduction,
        description: req.body.description,
        serviceRegions: req.body.serviceRegions,
        serviceTypes: req.body.serviceTypes,
      };

      const result = await createMoverProfile(userId, profileData);
      res.json({
        success: true,
        message: PROFILE_SUCCESS_MESSAGES.MOVER_PROFILE_CREATED,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: PROFILE_ERROR_MESSAGES.INVALID_USER_ROLE,
      });
    }
  } catch (error) {
    handleError(res, error, PROFILE_ERROR_MESSAGES.PROFILE_CREATION_FALLBACK);
  }
};

// 일반 유저 프로필 수정
const patchCustomerProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as { userId: number };

    // 통합 프로필 수정 데이터 준비
    const updateData: TUserProfileUpdateInput = {
      // 기본 정보
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      // 비밀번호 변경
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      // 프로필 정보
      profileImage: req.body.profileImage,
      currentRegion: req.body.currentRegion,
      userServices: req.body.userServices,
    };

    await updateCustomerProfile(userId, updateData);

    res.json({
      success: true,
      message: "사용자 프로필이 성공적으로 수정되었습니다",
    });
  } catch (error) {
    console.log(error);
    handleError(res, error, "사용자 프로필 수정 중 오류가 발생했습니다");
  }
};

export { getUser, postUserProfile, patchCustomerProfile };

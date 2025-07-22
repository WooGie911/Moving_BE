import { Request, Response } from "express";
import {
  userInfo,
  createCustomerProfile,
  createMoverProfile,
  updateMoverBasicInfo,
} from "../services/user.service";
import { handleError } from "../utils/handleError";
import {
  TCustomerProfileInput,
  TMoverProfileInput,
  TUserRole,
} from "../types/user.types";
import {
  PROFILE_SUCCESS_MESSAGES,
  PROFILE_ERROR_MESSAGES,
} from "../constants/profile.constants";

// 유저 정보 조회
const getUser = async (req: Request, res: Response) => {
  const { userId, userType } = req.user as {
    userId: string;
    userType: TUserRole;
  };

  const user = await userInfo(userId, userType);

  res.json({ success: true, data: user });
};

// 프로필 등록 및 수정
const postProfile = async (req: Request, res: Response) => {
  try {
    const { userId, userType } = req.user as {
      userId: string;
      userType: TUserRole;
    };

    if (userType === "CUSTOMER") {
      // 일반 유저 프로필 등록
      const profileData: TCustomerProfileInput = {
        nickname: req.body.nickname,
        customerImage: req.body.customerImage,
        currentArea: req.body.currentArea,
        preferredServices: req.body.preferredServices,
      };

      const result = await createCustomerProfile(userId, profileData);
      res.json({
        success: true,
        message: PROFILE_SUCCESS_MESSAGES.CUSTOMER_PROFILE_CREATED,
        data: result,
      });
    } else if (userType === "MOVER") {
      // 기사님 프로필 등록
      const profileData: TMoverProfileInput = {
        nickname: req.body.nickname,
        moverImage: req.body.moverImage,
        career: req.body.career,
        shortIntro: req.body.shortIntro,
        detailIntro: req.body.detailIntro,
        currentAreas: req.body.currentAreas,
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
    console.log(error);
    handleError(res, error);
  }
};

// 기사님 기본정보 수정
const patchMoverBasicInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as { userId: string };

    const updateData = {
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    };
    await updateMoverBasicInfo(userId, updateData);
    res.json({
      success: true,
      message: "기사님 기본정보가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    handleError(res, error, "기사님 기본정보 수정 중 오류가 발생했습니다");
  }
};

export { getUser, postProfile, patchMoverBasicInfo };

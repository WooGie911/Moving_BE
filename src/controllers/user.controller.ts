import { Request, Response } from "express";
import {
  userInfo,
  createCustomerProfile,
  createMoverProfile,
  updateMoverBasicInfo,
  updateMoverProfileCheck,
  getProfileData,
  updateCustomerProfileCheck,
} from "../services/user.service";
import { handleError } from "../utils/handleError";
import { TCustomerProfileInput, TMoverProfileInput, TUserRole } from "../types/user.types";
import { PROFILE_SUCCESS_MESSAGES, PROFILE_ERROR_MESSAGES } from "../constants/profile.constants";
import { authCookieOptions } from "./auth.controller";
import { TOKEN_EXPIRES } from "../constants/token.constants";

// 유저 정보 조회
const getUser = async (req: Request, res: Response) => {
  const { userId, userType } = req.user as {
    userId: string;
    userType: TUserRole;
  };

  try {
    const user = await userInfo(userId, userType);

    res.json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
};

// 프로필 조회
const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId, userType } = req.user as {
      userId: string;
      userType: TUserRole;
    };

    const profile = await getProfileData(userId, userType);

    res.json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error, "프로필 조회 중 오류가 발생했습니다.");
  }
};

// 프로필 등록
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

      const { result, accessToken, refreshToken, provider } = await createCustomerProfile(userId, profileData);

      res.cookie("accessToken", accessToken, authCookieOptions(TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE, false));

      res.cookie("refreshToken", refreshToken, authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE));

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

      const { result, accessToken, refreshToken } = await createMoverProfile(userId, profileData);

      res.cookie("accessToken", accessToken, authCookieOptions(TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE, false));

      res.cookie("refreshToken", refreshToken, authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE));

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
    handleError(res, error);
  }
};

// 일반 유저 프로필 수정
const patchCustomerProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as { userId: string };

    const updateData = {
      name: req.body.name,
      nickname: req.body.nickname,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      newPassword: req.body.newPassword,
      customerImage: req.body.customerImage,
      currentArea: req.body.currentArea,
      preferredServices: req.body.preferredServices,
    };

    await updateCustomerProfileCheck(userId, updateData);
    res.json({
      success: true,
      message: PROFILE_SUCCESS_MESSAGES.CUSTOMER_PROFILE_UPDATED,
      data: updateData,
    });
  } catch (error) {
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

// 기사님 프로필 수정
const patchMoverProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as { userId: string };

    const updateData = {
      nickname: req.body.nickname,
      moverImage: req.body.moverImage,
      currentAreas: req.body.currentAreas,
      serviceTypes: req.body.serviceTypes,
      shortIntro: req.body.shortIntro,
      detailIntro: req.body.detailIntro,
      career: req.body.career,
      isVeteran: req.body.isVeteran,
    };

    const result = await updateMoverProfileCheck(userId, updateData);
    res.json({
      success: true,
      message: "기사님 프로필이 성공적으로 수정되었습니다.",
      data: result,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

export { getUser, postProfile, getProfile, patchCustomerProfile, patchMoverBasicInfo, patchMoverProfile };

import { Request, Response } from "express";
import {
  userInfo,
  createCustomerProfile,
  createMoverProfile,
} from "../services/user.service";
import { handleError } from "../utils/handleError";
import { TCustomerProfileInput, TMoverProfileInput } from "../types/user.types";

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
      role: string;
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
        message: "프로필이 성공적으로 등록되었습니다",
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
        message: "프로필이 성공적으로 등록되었습니다",
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "유효하지 않은 사용자 역할입니다",
      });
    }
  } catch (error) {
    handleError(res, error, "프로필 등록 중 오류가 발생했습니다");
  }
};

// 유저 프로필 수정
const patchUserProfile = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: number };

  res.json({ success: true, data: userId });
};

export { getUser, postUserProfile, patchUserProfile };

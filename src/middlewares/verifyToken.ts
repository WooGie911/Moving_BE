import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TUserRole } from "../types/user.types";

export const verifyAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "로그인이 필요합니다. 다시 로그인해 주세요." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      userId: string;
      name: string;
      userType: TUserRole;
      hasProfile: boolean;
      iat: number;
      exp: number;
    };

    req.user = decoded;
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "로그인 세션이 만료되었습니다. 다시 로그인해 주세요.",
      });
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "유효하지 않은 로그인 정보입니다. 다시 로그인해 주세요.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "인증에 실패했습니다. 다시 로그인해 주세요.",
    });
  }
};

export const verifyRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET_KEY!) as {
      userId: string;
      name: string;
      userType: TUserRole;
      hasProfile: boolean;
      iat: number;
      exp: number;
    };

    req.refreshToken = decoded;

    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "토큰 만료 시간이 지났습니다. 다시 로그인해 주세요.",
      });
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message:
          "Refresh token이 변조되었거나 잘못된 형식입니다. 다시 로그인해 주세요.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Refresh token이 유효하지 않습니다.  다시 로그인해 주세요.",
    });
  }
};

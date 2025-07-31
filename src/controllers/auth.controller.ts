import { Request, Response } from "express";
import authService from "../services/auth.service";
import { TOKEN_EXPIRES } from "../constants/token.constants";

import { handleError } from "../utils/handleError";
import { TCookieOptions } from "../types/cookie.types";
import { TUserRole } from "../types/user.types";

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000";

export const authCookieOptions = (maxAgeSeconds: number): TCookieOptions => ({
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 개발환경에서는 lax 사용
  secure: process.env.NODE_ENV === "production", // 개발환경에서는 false
  path: "/",
  maxAge: maxAgeSeconds * 1000,
  domain: process.env.NODE_ENV === "production" ? ".gomoving.site" : undefined, // 모든 서브도메인 공유
});

// 로그인
const postSignin = async (req: Request, res: Response) => {
  const { email, password, userType } = req.body;

  try {
    const {
      id,
      userName,
      userType: userTypeResponse,
      accessToken,
      refreshToken,
    } = await authService.signin(email, password, userType);

    res.cookie(
      "refreshToken",
      refreshToken,
      authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
    );

    res.status(200).json({
      success: true,
      message: "로그인 성공",
      user: {
        id,
        userName,
        userType: userTypeResponse,
      },
      accessToken,
    });
  } catch (error: any) {
    console.error("로그인 에러:", error);
    console.error("에러 상세 정보:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown",
    });
    handleError(res, error);
  }
};

// 회원가입
const postSignup = async (req: Request, res: Response) => {
  const { name, email, phoneNumber, password, userType } = req.body;

  try {
    const {
      id,
      userName,
      userType: userTypeResponse,
      accessToken,
      refreshToken,
    } = await authService.signup({
      name,
      email,
      phoneNumber,
      password,
      userType,
    });

    res.cookie(
      "refreshToken",
      refreshToken,
      authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
    );

    res.status(200).json({
      success: true,
      message: "회원가입 성공",
      user: {
        id,
        name: userName,
        userType: userTypeResponse,
      },
      accessToken,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

// 로그아웃
const postLogout = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string };

  try {
    await authService.logout(userId);

    res.clearCookie("accessToken", authCookieOptions(0));
    res.clearCookie("refreshToken", authCookieOptions(0));

    res.status(200).json({
      success: true,
      message: "로그아웃 성공",
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

// 토큰 갱신
const postRefresh = async (req: Request, res: Response) => {
  const { userId, userType, exp } = req.refreshToken as {
    userId: string;
    userType: TUserRole;
    exp: number;
  };

  try {
    const { accessToken, refreshToken } = await authService.refresh({
      exp,
      userType,
      userId,
    });

    // 리프레쉬 쿠키까지 재발급 된다면 저장
    if (refreshToken) {
      res.cookie(
        "refreshToken",
        refreshToken,
        authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
      );
    }

    res.status(200).json({
      success: true,
      message: "토큰 갱신 성공",
      accessToken,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

// 구글 로그인 콜백
const getGoogleCallback = async (req: Request, res: Response) => {
  const { accessToken, refreshToken, userType } = req.user as any;

  try {
    res.cookie("accessToken", accessToken, {
      httpOnly: false,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE * 1000,
      domain:
        process.env.NODE_ENV === "production" ? ".gomoving.site" : undefined,
    });

    res.cookie(
      "refreshToken",
      refreshToken,
      authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
    );

    res.redirect(`${FRONTEND_URL}/`);
  } catch (error: any) {
    const params = new URLSearchParams({
      success: "false",
      message: "구글 로그인 실패",
    });

    if (userType === "CUSTOMER") {
      res.redirect(`${FRONTEND_URL}/userSignin?${params}`);
    } else {
      res.redirect(`${FRONTEND_URL}/moverSignin?${params}`);
    }
  }
};

// 카카오 로그인 콜백
const getKakaoCallback = async (req: Request, res: Response) => {
  const { accessToken, refreshToken, userType } = req.user as any;

  try {
    res.cookie("accessToken", accessToken, {
      httpOnly: false,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE * 1000,
      domain:
        process.env.NODE_ENV === "production" ? ".gomoving.site" : undefined,
    });

    res.cookie(
      "refreshToken",
      refreshToken,
      authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
    );

    res.redirect(`${FRONTEND_URL}/`);
  } catch (error: any) {
    const params = new URLSearchParams({
      success: "false",
      message: "카카오 로그인 실패",
    });

    if (userType === "CUSTOMER") {
      res.redirect(`${FRONTEND_URL}/userSignin?${params}`);
    } else {
      res.redirect(`${FRONTEND_URL}/moverSignin?${params}`);
    }
  }
};

// 네이버 로그인 콜백
const getNaverCallback = async (req: Request, res: Response) => {
  const { accessToken, refreshToken, userType } = req.user as any;

  try {
    res.cookie("accessToken", accessToken, {
      httpOnly: false,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE * 1000,
      domain:
        process.env.NODE_ENV === "production" ? ".gomoving.site" : undefined,
    });
    res.cookie(
      "refreshToken",
      refreshToken,
      authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
    );

    res.redirect(`${FRONTEND_URL}/`);
  } catch (error: any) {
    const params = new URLSearchParams({
      success: "false",
      message: "네이버 로그인 실패",
    });

    if (userType === "CUSTOMER") {
      res.redirect(`${FRONTEND_URL}/userSignin?${params}`);
    } else {
      res.redirect(`${FRONTEND_URL}/moverSignin?${params}`);
    }
  }
};

export {
  postSignin,
  postSignup,
  postLogout,
  postRefresh,
  getGoogleCallback,
  getKakaoCallback,
  getNaverCallback,
};

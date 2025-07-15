import { Request, Response } from "express";
import authService from "../services/auth.service";
import { TOKEN_EXPIRES } from "../constants/token.constants";

import { handleError } from "../utils/handleError";
import { TCookieOptions } from "../types/cookie.types";
import { AuthenticationError } from "../types/commonError.types";

const authCookieOptions = (maxAgeSeconds: number): TCookieOptions => ({
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 개발환경에서는 lax 사용
  secure: process.env.NODE_ENV === "production", // 개발환경에서는 false
  path: "/",
  maxAge: maxAgeSeconds * 1000,
});

const postSignin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { id, userName, userRole, accessToken, refreshToken } = await authService.signin(email, password);

    res.cookie("refreshToken", refreshToken, authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE));

    res.status(200).json({
      status: 200,
      message: "로그인 성공",
      user: {
        id,
        userName,
        userRole,
      },
      accessToken,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

const postSignup = async (req: Request, res: Response) => {
  const { name, email, phoneNumber, password, currentRole } = req.body;

  try {
    const { id, userName, userRole, accessToken, refreshToken } = await authService.signup({
      name,
      email,
      phoneNumber,
      password,
      currentRole,
    });

    res.cookie("refreshToken", refreshToken, authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE));

    res.status(200).json({
      status: 200,
      message: "회원가입 성공",
      user: {
        id,
        userName,
        userRole,
      },
      accessToken,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

const postLogout = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: number };

  try {
    await authService.logout(userId);

    res.clearCookie("accessToken", authCookieOptions(0));
    res.clearCookie("refreshToken", authCookieOptions(0));

    res.status(200).json({ message: "로그아웃 성공" });
  } catch (error: any) {
    handleError(res, error);
  }
};

const postRefresh = (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  res.status(200).json({ message: "refresh" });
};

export { postSignin, postSignup, postLogout, postRefresh };

import { Request, Response } from "express";
import authService from "../services/auth.service";
import { TOKEN_EXPIRES } from "../constants/token.constants";

import { handleError } from "../utils/handleError";
import { TCookieOptions } from "../types/cookie";

const authCookieOptions = (maxAgeSeconds: number): TCookieOptions => ({
  httpOnly: true,
  sameSite: "none", // 현재는 fe,be의 도메인이 다르기 때문에 none으로 설정
  secure: true,
  path: "/",
  maxAge: maxAgeSeconds * 1000,
});

const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await authService.signin(email, password);

    res.cookie(
      "accessToken",
      user.accessToken,
      authCookieOptions(TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE)
    );

    res.cookie(
      "refreshToken",
      user.refreshToken,
      authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
    );

    res.status(200).json({ status: 200, message: "로그인 성공" });
  } catch (error: any) {
    handleError(res, error);
  }
};

const signup = async (req: Request, res: Response) => {
  const { name, email, phoneNumber, password, currentRole } = req.body;

  try {
    const { accessToken, refreshToken } = await authService.signup({
      name,
      email,
      phoneNumber,
      password,
      currentRole,
    });

    res.cookie(
      "accessToken",
      accessToken,
      authCookieOptions(TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE)
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      authCookieOptions(TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE)
    );

    res.status(200).json({
      status: 200,
      message: "회원가입 성공",
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

const logout = (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  res.status(200).json({ message: "logout" });
};

const refresh = (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  res.status(200).json({ message: "refresh" });
};

export { signin, signup, logout, refresh };

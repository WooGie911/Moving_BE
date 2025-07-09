import { Request, Response } from "express";
import authService from "../services/auth.service";
import { TOKEN_EXPIRES } from "../constants/token.constants";

const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await authService.signin(email, password);

  res.cookie("accessToken", user.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE,
  });

  res.cookie("refreshToken", user.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE,
  });

  res.status(200).json({ message: "success", user });
};

const signup = (req: Request, res: Response) => {
  const { email, password } = req.body;
  res.status(200).json({ message: "signup" });
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

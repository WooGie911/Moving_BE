import { Request, Response } from "express";
import authService from "../services/auth.service";
import { TOKEN_EXPIRES } from "../constants/token.constants";
import {
  AuthenticationError,
  DatabaseError,
  ServerError,
  ValidationError,
} from "../types/commonError";

const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await authService.signin(email, password);

    res.cookie("accessToken", user.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE * 1000, // ✅ 초 → ms 변환
    });

    res.cookie("refreshToken", user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE * 1000, // ✅ 초 → ms 변환
    });

    res.status(200).json({ status: 200, message: "로그인 성공" });
  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ status: 401, message: error.message });
    } else if (error instanceof ValidationError) {
      res.status(422).json({ status: 422, message: error.message });
    } else if (error instanceof DatabaseError) {
      res.status(500).json({ status: 500, message: error.message });
    } else if (error instanceof ServerError) {
      res.status(500).json({ status: 500, message: error.message });
    } else {
      res
        .status(500)
        .json({ status: 500, message: "예상치 못한 오류로 인한 로그인 실패" });
    }
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

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_EXPIRES.ACCESS_TOKEN_COOKIE * 1000, // ✅ 초 → ms 변환
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_EXPIRES.REFRESH_TOKEN_COOKIE * 1000, // ✅ 초 → ms 변환
    });

    res.status(200).json({
      status: 200,
      message: "회원가입 성공",
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(422).json({
        status: 422,
        message: error.message,
        error: error.data,
      });
    } else if (error instanceof DatabaseError) {
      res.status(500).json({
        status: 500,
        message: error.message,
        error: error.data,
      });
    } else if (error instanceof ServerError) {
      res.status(500).json({
        status: 500,
        message: error.message,
        error: error.data,
      });
    } else {
      res.status(500).json({
        status: 500,
        message: "예상치 못한 오류로 인한 회원가입 실패",
        error: error.message,
      });
    }
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

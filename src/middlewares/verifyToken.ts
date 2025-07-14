import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      userId: number;
      name: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Access token이 유효하지 않습니다." });
  }
};

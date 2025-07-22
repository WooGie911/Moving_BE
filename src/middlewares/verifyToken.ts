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
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      userId: string;
      name: string;
      userType: TUserRole;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Access token이 유효하지 않습니다." });
  }
};

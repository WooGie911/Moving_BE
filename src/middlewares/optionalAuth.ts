import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as any;
      req.user = {
        userId: decoded.userId,
        name: decoded.name,
        userType: decoded.userType,
      };
    }
  } catch (error) {
    // 토큰이 유효하지 않으면 비회원으로 처리
    console.log("토큰이 유효하지 않아 비회원으로 처리합니다.");
  }
  next();
};

import jwt from "jsonwebtoken";
import { TOKEN_EXPIRES } from "../constants/token.constants";
import { TUserTokenCreate } from "../types/user.types";

export function generateAccessToken(user: TUserTokenCreate): string {
  const payload = {
    userId: user.id,
    name: user.name,
    userType: user.userType,
    hasProfile: user.hasProfile,
  };

  const accessSecret = process.env.JWT_SECRET_KEY;

  if (!accessSecret) {
    throw new Error("시크릿키를 확인하세요");
  }

  const newAccessToken = jwt.sign(payload, accessSecret, {
    expiresIn: TOKEN_EXPIRES.ACCESS_TOKEN,
  });

  return newAccessToken;
}

export function generateRefreshToken(user: TUserTokenCreate): string {
  const payload = {
    userId: user.id,
    name: user.name,
    userType: user.userType,
    hasProfile: user.hasProfile,
  };

  const refreshSecret = process.env.JWT_REFRESH_SECRET_KEY;

  if (!refreshSecret) {
    throw new Error("시크릿키를 확인하세요");
  }

  const newRefreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: TOKEN_EXPIRES.REFRESH_TOKEN,
  });

  return newRefreshToken;
}

export function generateToken(user: TUserTokenCreate): {
  newAccessToken: string;
  newRefreshToken: string;
} {
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return { newAccessToken, newRefreshToken };
}

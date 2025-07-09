import jwt from "jsonwebtoken";
import { TOKEN_EXPIRES } from "../constants/token.constants";
import { TUserTokenCreate } from "../types/user";

export function generateAccessToken(user: TUserTokenCreate): string {
  const payload = {
    userId: user.id,
    name: user.name,
    role: user.currentRole,
  };

  const accessSecret = process.env.JWT_SECRET_KEY;

  if (!accessSecret) {
    console.error("SECRET_KEY가 .env 파일에 없습니다.");
    throw new Error("시크릿키를 확인하세요");
  }

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: TOKEN_EXPIRES.ACCESS_TOKEN,
  });

  return accessToken;
}

export function generateRefreshToken(user: TUserTokenCreate): string {
  const payload = {
    userId: user.id,
    name: user.name,
    role: user.currentRole,
  };

  const refreshSecret = process.env.JWT_REFRESH_SECRET_KEY;

  if (!refreshSecret) {
    console.error("SECRET_KEY가 .env 파일에 없습니다.");
    throw new Error("시크릿키를 확인하세요");
  }

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: TOKEN_EXPIRES.REFRESH_TOKEN,
  });

  return refreshToken;
}

import jwt from "jsonwebtoken";
import { TUserRole } from "../../src/types/user.types";

export function signAccessToken(input: { userId: string; name: string; userType: TUserRole; hasProfile: boolean }) {
  return jwt.sign(input, process.env.JWT_SECRET_KEY!, { expiresIn: "1h" });
}

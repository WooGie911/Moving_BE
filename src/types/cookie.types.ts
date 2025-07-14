export type TCookieOptions = {
  httpOnly: boolean;
  sameSite: "none" | "lax" | "strict";
  secure: boolean;
  path: string;
  maxAge: number;
};

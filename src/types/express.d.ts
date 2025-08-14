declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      name: string;
      userType: "CUSTOMER" | "MOVER";
      hasProfile: boolean;
      iat: number;
      exp: number;
    };
    refreshToken?: {
      userId: string;
      name: string;
      userType: "CUSTOMER" | "MOVER";
      hasProfile: boolean;
      iat: number;
      exp: number;
    };
  }
}

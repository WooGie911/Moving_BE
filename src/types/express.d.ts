declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      name: string;
      userType: "CUSTOMER" | "MOVER";
    };
  }
}

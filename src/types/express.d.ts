declare namespace Express {
  interface Request {
    user?: {
      userId: number;
      name: string;
      role: string;
    };
  }
}

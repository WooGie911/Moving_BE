import { Request, Response } from "express";
import { userInfo } from "../services/user.service";

const getUser = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: number };

  console.log(userId);

  const user = await userInfo(userId);

  res.json({ success: true, data: user });
};

export { getUser };

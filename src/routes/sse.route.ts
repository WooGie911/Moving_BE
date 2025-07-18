import { Request, Response, Router } from "express";
import { registerSSE } from "../utils/emitNotificationSSE";
import { verifyAccessToken } from "../middlewares/verifyToken";

const sseRouter = Router();

sseRouter.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  registerSSE(userId, res);
});

export default sseRouter;

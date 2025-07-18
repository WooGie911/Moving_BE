import { Router } from "express";
import actionTestController from "../controllers/actionTest.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const actionTestRouter = Router();

actionTestRouter.post(
  "/test",
  verifyAccessToken,
  actionTestController.createTestAction
);

export default actionTestRouter;

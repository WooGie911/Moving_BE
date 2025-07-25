import { Request, Response } from "express";
import actionService from "../services/action.service";
import { ActionType } from "@prisma/client";

const actionTestController = {
  // POST /actions/test
  createTestAction: async (req: Request, res: Response) => {
    try {
      // 테스트용 임의 값 (userId, entityId 등은 실제 존재하는 값으로 대체 필요)
      const userId = req.user?.userId;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "해당 유저를 찾을수 없습니다." });
      }
      const testAction = await actionService.createAction(
        userId, // userId
        ActionType.ESTIMATE_REQUEST_CREATE, // type
        "cmdgsc8cx00ft4wv3u8v53uhk", // entityId (예: quoteId)
        "EstimateRequest", // entityType
        { memo: "테스트용 액션 생성" } // metadata
      );
      res.status(201).json({ success: true, data: testAction });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default actionTestController;

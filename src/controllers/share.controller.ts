import { Request, Response } from "express";
import shareService from "../services/share.service";
import { ControllerError } from "../types/errors.types";

const shareController = {
  // 공유 데이터 조회
  getShareData: async (req: Request, res: Response) => {
    try {
      const { estimateRequestId, estimateId } = req.params;

      // 매개변수 검증
      if (!estimateRequestId) {
        return res.status(400).json({
          success: false,
          message: "견적요청 ID가 필요합니다.",
        });
      }

      const shareData = await shareService.getShareData(
        estimateRequestId,
        estimateId
      );

      return res.status(200).json({
        success: true,
        data: shareData,
      });
    } catch (error) {
      if (error instanceof ControllerError) {
        return res.status(400).json({
          success: false,
          message: (error as Error).message,
        });
      }

      console.error("공유 데이터 조회 에러:", error);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  },
};

export default shareController;

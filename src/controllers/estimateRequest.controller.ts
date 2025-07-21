import { Request, Response } from "express";
import { MoveType, RequestStatus, EstimateRequest } from "@prisma/client";
import EstimateRequestService from "../services/estimateRequest.service";

const estimateRequestService = new EstimateRequestService();

class EstimateRequestController {
  async createEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, message: "인증이 필요합니다." });
      }
      const hasPending = await estimateRequestService.hasPendingRequest(userId);
      if (hasPending) {
        return res.status(400).json({ success: false, message: "이미 진행중인 견적 요청이 있습니다." });
      }
      // ... 나머지 로직 ...
    } catch (error) {
      // ...
    }
  }
  async getActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, message: "인증이 필요합니다." });
      }
      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      if (!active) {
        return res.status(404).json({ success: false, message: "활성 견적 요청이 없습니다." });
      }
      return res.status(200).json({ success: true, message: "활성 견적 요청 조회 성공", data: active });
    } catch (error) {
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }
  async updateActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      const isPending = await estimateRequestService.isActiveRequestPending(userId);
      if (!isPending) {
        return res.status(400).json({ success: false, message: "진행중(PENDING) 상태에서만 수정할 수 있습니다." });
      }
      // ... 나머지 로직 ...
    } catch (error) {
      // ...
    }
  }
  async cancelActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      const isPending = await estimateRequestService.isActiveRequestPending(userId);
      if (!isPending) {
        return res.status(400).json({ success: false, message: "진행중(PENDING) 상태에서만 취소할 수 있습니다." });
      }
      const hasEstimate = await estimateRequestService.hasEstimateFromMover(userId);
      if (hasEstimate) {
        return res.status(400).json({ success: false, message: "기사님이 견적을 제출한 경우 취소할 수 없습니다." });
      }
      // ... 나머지 로직 ...
    } catch (error) {
      // ...
    }
  }
}
export default EstimateRequestController;

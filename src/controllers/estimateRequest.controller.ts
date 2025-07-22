import { Request, Response } from "express";
import { MoveType, RequestStatus, EstimateRequest } from "@prisma/client";
import EstimateRequestService from "../services/estimateRequest.service";
import { TCreateEstimateRequest } from "../types/estimateRequest.types";

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
        return res.status(409).json({ success: false, message: "이미 진행중인 견적 요청이 있습니다." });
      }
      // 주소 직접 입력 방식으로 파라미터 받기
      const {
        moveType,
        fromCity,
        fromDistrict,
        fromDetail,
        fromRegion,
        toCity,
        toDistrict,
        toDetail,
        toRegion,
        moveDate,
        description,
      } = req.body;
      const params: TCreateEstimateRequest = {
        userId,
        moveType,
        fromCity,
        fromDistrict,
        fromDetail,
        fromRegion,
        toCity,
        toDistrict,
        toDetail,
        toRegion,
        moveDate,
        description,
      };
      const result = await estimateRequestService.createEstimateRequest(params);
      return res.status(201).json({ success: true, message: "견적 요청이 성공적으로 생성되었습니다.", data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }
  async getActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, message: "인증이 필요합니다." });
      }
      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      const hasActive = !!active;
      return res.status(200).json({ success: true, hasActive });
    } catch (error) {
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }
  async updateActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      const isPending = await estimateRequestService.isActiveRequestPending(userId);
      if (!isPending) {
        return res.status(409).json({ success: false, message: "진행중(PENDING) 상태에서만 수정할 수 있습니다." });
      }
      // 활성 견적 요청 찾기
      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      if (!active) {
        return res.status(404).json({ success: false, message: "활성 견적 요청이 없습니다." });
      }
      // 업데이트
      const updateData = req.body;
      const updated = await estimateRequestService.updateActiveEstimateRequest(active.id, updateData);
      return res.status(200).json({ success: true, message: "견적 요청이 성공적으로 수정되었습니다.", data: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }
  async cancelActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      const isPending = await estimateRequestService.isActiveRequestPending(userId);
      if (!isPending) {
        return res.status(409).json({ success: false, message: "진행중(PENDING) 상태에서만 취소할 수 있습니다." });
      }
      const hasEstimate = await estimateRequestService.hasEstimateFromMover(userId);
      if (hasEstimate) {
        return res.status(409).json({ success: false, message: "기사님이 견적을 제출한 경우 취소할 수 없습니다." });
      }
      // 활성 견적 요청 찾기
      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      if (!active) {
        return res.status(404).json({ success: false, message: "활성 견적 요청이 없습니다." });
      }
      // 취소 처리
      await estimateRequestService.cancelActiveEstimateRequest(active.id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }
}
export default EstimateRequestController;

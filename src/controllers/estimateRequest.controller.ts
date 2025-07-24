import { Request, Response } from "express";
import { MoveType, RequestStatus, EstimateRequest } from "@prisma/client";
import EstimateRequestService from "../services/estimateRequest.service";
import { TCreateEstimateRequest, TUpdateEstimateRequest } from "../types/estimateRequest.types";
import { getKoreaToday, isBeforeKoreaToday } from "../utils/dateUtils";

const estimateRequestService = new EstimateRequestService();

class EstimateRequestController {
  async createEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, message: "인증이 필요합니다." });
      }

      // 유저 유형 확인 - 기사님은 견적 요청을 생성할 수 없음
      const { isCustomer, isMover } = await estimateRequestService.checkUserType(userId);
      if (!isCustomer) {
        return res.status(403).json({
          success: false,
          message: "기사님은 견적 요청을 생성할 수 없습니다. 일반 고객으로 로그인해주세요.",
        });
      }

      const hasPending = await estimateRequestService.hasPendingRequest(userId);
      if (hasPending) {
        return res.status(409).json({ success: false, message: "이미 진행중인 견적 요청이 있습니다." });
      }

      // 프론트엔드 요청 구조에 맞게 파라미터 받기
      const { movingType, movingDate, departure, arrival, description } = req.body;

      // 이사일이 과거인지 확인 (한국 시간 기준)
      const moveDate = new Date(movingDate);

      if (isBeforeKoreaToday(moveDate)) {
        return res.status(400).json({
          success: false,
          message: "이사일은 오늘 이후로 설정해주세요.",
        });
      }

      // 출발지와 도착지 주소가 완전히 같은지 검사
      const safeEq = (a: any, b: any) => (a || "").toString().trim() === (b || "").toString().trim();
      if (
        safeEq(departure?.roadAddress, arrival?.roadAddress) &&
        safeEq(departure?.detailAddress, arrival?.detailAddress)
      ) {
        return res.status(400).json({ success: false, message: "출발지와 도착지는 달라야 합니다." });
      }

      const params: TCreateEstimateRequest = {
        userId,
        movingType,
        movingDate,
        departure,
        arrival,
        description,
      };

      const result = await estimateRequestService.createEstimateRequest(params);
      return res.status(201).json({ success: true, message: "견적 요청이 성공적으로 생성되었습니다.", data: result });
    } catch (error) {
      console.error("견적 요청 생성 에러:", error);
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }

  async getActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, message: "인증이 필요합니다." });
      }

      // 유저 유형 확인 - 기사님은 견적 요청을 조회할 수 없음
      const { isCustomer, isMover } = await estimateRequestService.checkUserType(userId);
      if (!isCustomer) {
        return res.status(403).json({
          success: false,
          message: "기사님은 견적 요청을 조회할 수 없습니다. 일반 고객으로 로그인해주세요.",
        });
      }

      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      const hasActive = !!active;

      if (hasActive) {
        // 견적 요청이 만료되었는지 확인
        const isExpired = await estimateRequestService.isRequestExpired(active.id);
        if (isExpired && active.status === RequestStatus.PENDING) {
          // 만료된 PENDING 상태의 견적 요청을 EXPIRED로 변경
          await estimateRequestService.expireOverdueRequests();
          return res.status(200).json({ success: true, hasActive: false });
        }

        // 프론트엔드 응답 구조에 맞게 변환
        const responseData = {
          id: active.id,
          userId: active.customerId,
          movingType: active.moveType,
          departureAddress: active.fromAddress
            ? `${active.fromAddress.region} ${active.fromAddress.city} ${active.fromAddress.district}`
            : "",
          arrivalAddress: active.toAddress
            ? `${active.toAddress.region} ${active.toAddress.city} ${active.toAddress.district}`
            : "",
          departureDetailAddress: active.fromAddress?.detail || null,
          arrivalDetailAddress: active.toAddress?.detail || null,
          movingDate: active.moveDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
          status: active.status,
          createdAt: active.createdAt.toISOString(),
          updatedAt: active.updatedAt.toISOString(),
        };

        return res.status(200).json({ success: true, hasActive, data: responseData });
      } else {
        return res.status(200).json({ success: true, hasActive });
      }
    } catch (error) {
      console.error("활성 견적 요청 조회 에러:", error);
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }

  async updateActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, message: "인증이 필요합니다." });
      }

      // 유저 유형 확인 - 기사님은 견적 요청을 수정할 수 없음
      const { isCustomer, isMover } = await estimateRequestService.checkUserType(userId);
      if (!isCustomer) {
        return res.status(403).json({
          success: false,
          message: "기사님은 견적 요청을 수정할 수 없습니다. 일반 고객으로 로그인해주세요.",
        });
      }

      const isPending = await estimateRequestService.isActiveRequestPending(userId);
      if (!isPending) {
        return res.status(409).json({ success: false, message: "진행중(PENDING) 상태에서만 수정할 수 있습니다." });
      }

      // 활성 견적 요청 찾기
      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      if (!active) {
        return res.status(404).json({ success: false, message: "활성 견적 요청이 없습니다." });
      }

      // 견적 요청이 만료되었는지 확인
      const isExpired = await estimateRequestService.isRequestExpired(active.id);
      if (isExpired) {
        return res.status(409).json({
          success: false,
          message: "이사일이 지나 만료된 견적 요청은 수정할 수 없습니다.",
        });
      }

      // 프론트엔드 요청 구조에 맞게 파라미터 받기
      const { movingType, movingDate, departure, arrival, description } = req.body;

      // 이사일이 과거인지 확인 (수정 시에만, 한국 시간 기준)
      if (movingDate) {
        const moveDate = new Date(movingDate);

        if (isBeforeKoreaToday(moveDate)) {
          return res.status(400).json({
            success: false,
            message: "이사일은 오늘 이후로 설정해주세요.",
          });
        }
      }

      // 출발지와 도착지 주소가 완전히 같은지 검사
      const safeEq = (a: any, b: any) => (a || "").toString().trim() === (b || "").toString().trim();
      if (
        safeEq(departure?.roadAddress, arrival?.roadAddress) &&
        safeEq(departure?.detailAddress, arrival?.detailAddress)
      ) {
        return res.status(400).json({ success: false, message: "출발지와 도착지는 달라야 합니다." });
      }

      const updateData: TUpdateEstimateRequest = {
        movingType,
        movingDate,
        departure,
        arrival,
        description,
      };

      const updated = await estimateRequestService.updateActiveEstimateRequest(active.id, updateData);
      return res.status(200).json({ success: true, message: "견적 요청이 성공적으로 수정되었습니다.", data: updated });
    } catch (error) {
      console.error("견적 요청 수정 에러:", error);
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }

  async cancelActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as string;
      if (!userId) {
        return res.status(401).json({ success: false, message: "인증이 필요합니다." });
      }

      // 유저 유형 확인 - 기사님은 견적 요청을 취소할 수 없음
      const { isCustomer, isMover } = await estimateRequestService.checkUserType(userId);
      if (!isCustomer) {
        return res.status(403).json({
          success: false,
          message: "기사님은 견적 요청을 취소할 수 없습니다. 일반 고객으로 로그인해주세요.",
        });
      }

      const isPending = await estimateRequestService.isActiveRequestPending(userId);
      if (!isPending) {
        return res.status(409).json({ success: false, message: "진행중(PENDING) 상태에서만 취소할 수 있습니다." });
      }

      // 기사님이 견적을 제출했는지 확인 (PROPOSED 상태)
      const hasEstimate = await estimateRequestService.hasEstimateFromMover(userId);
      if (hasEstimate) {
        return res.status(409).json({
          success: false,
          message: "기사님이 견적을 제출한 경우 취소할 수 없습니다. 견적을 확인한 후 결정해주세요.",
        });
      }

      // 활성 견적 요청 찾기
      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      if (!active) {
        return res.status(404).json({ success: false, message: "활성 견적 요청이 없습니다." });
      }

      // 견적 요청이 만료되었는지 확인
      const isExpired = await estimateRequestService.isRequestExpired(active.id);
      if (isExpired) {
        return res.status(409).json({
          success: false,
          message: "이사일이 지나 만료된 견적 요청은 취소할 수 없습니다.",
        });
      }

      // 취소 처리
      await estimateRequestService.cancelActiveEstimateRequest(active.id);
      return res.status(200).json({ success: true, message: "견적 요청이 취소되었습니다." });
    } catch (error) {
      console.error("견적 요청 취소 에러:", error);
      return res.status(500).json({ success: false, message: "서버 내부 오류가 발생했습니다." });
    }
  }
}

export default EstimateRequestController;

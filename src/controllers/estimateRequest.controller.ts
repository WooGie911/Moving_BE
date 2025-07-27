import { Request, Response } from "express";
import EstimateRequestService from "../services/estimateRequest.service";
import { convertRegionToKorean } from "../utils/addressUtils";
import {
  TCreateEstimateRequest,
  TUpdateEstimateRequest,
  IDatabaseEstimateRequest,
  IEstimateRequestResponse,
  IAddressInfo,
  IUserTypeResult,
  ICreateValidationData,
  IUpdateValidationData,
  IValidationResult,
} from "../types/estimateRequest.types";

const estimateRequestService = new EstimateRequestService();

class EstimateRequestController {
  private getUserId(req: Request): string {
    if (!req.user || !req.user.userId) {
      throw new Error("인증이 필요합니다.");
    }
    return req.user.userId;
  }

  private validateUser(userId: string): void {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("인증이 필요합니다.");
    }
  }

  private async validateCustomerAccess(userId: string): Promise<void> {
    const { isCustomer }: IUserTypeResult = await estimateRequestService.checkUserType(userId);
    if (!isCustomer) {
      throw new Error("기사님은 견적 요청을 생성할 수 없습니다. 일반 고객으로 로그인해주세요.");
    }
  }

  private validateMoveDate(movingDate: string): void {
    try {
      const moveDate = new Date(movingDate);
      if (isNaN(moveDate.getTime())) {
        throw new Error("올바른 날짜 형식이 아닙니다. (YYYY-MM-DD 형식으로 입력해주세요)");
      }

      const today = new Date();
      const koreaTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      koreaTime.setHours(0, 0, 0, 0);

      if (moveDate < koreaTime) {
        throw new Error("이사일은 오늘 이후로 설정해주세요.");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("날짜 검증 중 오류가 발생했습니다.");
    }
  }

  private validateAddresses(departure: IAddressInfo, arrival: IAddressInfo): void {
    const isSameRoadAddress = (departure?.roadAddress || "").trim() === (arrival?.roadAddress || "").trim();
    const isSameDetailAddress = (departure?.detailAddress || "").trim() === (arrival?.detailAddress || "").trim();

    if (isSameRoadAddress && isSameDetailAddress) {
      throw new Error("출발지와 도착지는 달라야 합니다.");
    }
  }

  private validateCreateEstimateRequest(data: ICreateValidationData): IValidationResult {
    const errors: string[] = [];

    if (!["small", "home", "office"].includes(data.movingType.toLowerCase())) {
      errors.push("이사 종류는 small, home, office 중 하나여야 합니다.");
    }

    try {
      this.validateMoveDate(data.movingDate);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    try {
      this.validateAddresses(data.departure, data.arrival);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    if (!data.departure?.roadAddress?.trim()) {
      errors.push("출발지 주소는 필수입니다.");
    }

    if (!data.arrival?.roadAddress?.trim()) {
      errors.push("도착지 주소는 필수입니다.");
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateUpdateEstimateRequest(data: IUpdateValidationData): IValidationResult {
    const errors: string[] = [];

    if (data.movingType && !["small", "home", "office"].includes(data.movingType.toLowerCase())) {
      errors.push("이사 종류는 small, home, office 중 하나여야 합니다.");
    }

    if (data.movingDate) {
      try {
        this.validateMoveDate(data.movingDate);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error.message);
        }
      }
    }

    if (data.departure && data.arrival) {
      try {
        this.validateAddresses(data.departure, data.arrival);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error.message);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private formatEstimateRequestResponse(request: IDatabaseEstimateRequest): IEstimateRequestResponse {
    return {
      id: request.id,
      userId: request.customerId,
      movingType: request.moveType,
      departureAddress: request.fromAddress
        ? `${convertRegionToKorean(request.fromAddress.region)} ${request.fromAddress.city} ${request.fromAddress.district}`
        : "",
      arrivalAddress: request.toAddress
        ? `${convertRegionToKorean(request.toAddress.region)} ${request.toAddress.city} ${request.toAddress.district}`
        : "",
      departureDetailAddress: request.fromAddress?.detail || undefined,
      arrivalDetailAddress: request.toAddress?.detail || undefined,
      departurePostalCode: request.fromAddress?.postalCode || undefined,
      arrivalPostalCode: request.toAddress?.postalCode || undefined,
      movingDate: request.moveDate.toISOString().split("T")[0],
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }

  async createEstimateRequest(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      this.validateUser(userId);
      await this.validateCustomerAccess(userId);

      const hasPending = await estimateRequestService.hasPendingRequest(userId);
      if (hasPending) {
        return res.status(409).json({ success: false, message: "이미 진행중인 견적 요청이 있습니다." });
      }

      const { movingType, movingDate, departure, arrival, description } = req.body;

      const validation = this.validateCreateEstimateRequest({
        movingType,
        movingDate,
        departure,
        arrival,
        description,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors[0],
        });
      }

      const params: TCreateEstimateRequest = {
        userId,
        movingType,
        movingDate,
        departure,
        arrival,
        description,
      };

      await estimateRequestService.createEstimateRequest(params);

      const createdRequest = await estimateRequestService.getActiveEstimateRequestByUserId(userId);

      return res.status(201).json({
        success: true,
        message: "견적 요청이 성공적으로 생성되었습니다.",
        data: createdRequest ? this.formatEstimateRequestResponse(createdRequest) : null,
      });
    } catch (error) {
      console.error("견적 요청 생성 에러:", error);
      const message = error instanceof Error ? error.message : "서버 내부 오류가 발생했습니다.";
      const status = error instanceof Error && error.message.includes("인증") ? 401 : 500;
      return res.status(status).json({ success: false, message });
    }
  }

  async getActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      this.validateUser(userId);
      await this.validateCustomerAccess(userId);

      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      const hasActive = !!active;

      if (hasActive && active) {
        const responseData = this.formatEstimateRequestResponse(active);
        return res.status(200).json({ success: true, hasActive, data: responseData });
      } else {
        return res.status(200).json({ success: true, hasActive });
      }
    } catch (error) {
      console.error("활성 견적 요청 조회 에러:", error);
      const message = error instanceof Error ? error.message : "서버 내부 오류가 발생했습니다.";
      const status = error instanceof Error && error.message.includes("인증") ? 401 : 500;
      return res.status(status).json({ success: false, message });
    }
  }

  async updateActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      this.validateUser(userId);
      await this.validateCustomerAccess(userId);

      const isPending = await estimateRequestService.hasPendingRequest(userId);
      if (!isPending) {
        return res.status(409).json({
          success: false,
          message: "진행중(PENDING) 상태에서만 수정할 수 있습니다.",
        });
      }

      const hasEstimateFromMover = await estimateRequestService.hasEstimateFromMover(userId);
      if (hasEstimateFromMover) {
        return res.status(409).json({
          success: false,
          message: "기사님이 견적을 제출한 경우 수정할 수 없습니다. 견적을 확인한 후 결정해주세요.",
        });
      }

      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      if (!active) {
        return res.status(404).json({ success: false, message: "활성 견적 요청이 없습니다." });
      }

      if (active.status !== "PENDING") {
        return res.status(409).json({
          success: false,
          message: "진행중(PENDING) 상태에서만 수정할 수 있습니다.",
        });
      }

      const { movingType, movingDate, departure, arrival, description } = req.body;

      const validation = this.validateUpdateEstimateRequest({
        movingType,
        movingDate,
        departure,
        arrival,
        description,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors[0],
        });
      }

      const updateData: TUpdateEstimateRequest = {
        movingType,
        movingDate,
        departure,
        arrival,
        description,
      };

      await estimateRequestService.updateActiveEstimateRequest(active.id, updateData);

      const updatedRequest = await estimateRequestService.getActiveEstimateRequestByUserId(userId);

      return res.status(200).json({
        success: true,
        message: "견적 요청이 성공적으로 수정되었습니다.",
        data: updatedRequest ? this.formatEstimateRequestResponse(updatedRequest) : null,
      });
    } catch (error) {
      console.error("견적 요청 수정 에러:", error);
      const message = error instanceof Error ? error.message : "서버 내부 오류가 발생했습니다.";
      const status = error instanceof Error && error.message.includes("인증") ? 401 : 500;
      return res.status(status).json({ success: false, message });
    }
  }

  async cancelActiveEstimateRequest(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      this.validateUser(userId);
      await this.validateCustomerAccess(userId);

      const isPending = await estimateRequestService.hasPendingRequest(userId);
      if (!isPending) {
        return res.status(409).json({
          success: false,
          message: "진행중(PENDING) 상태에서만 취소할 수 있습니다.",
        });
      }

      const hasEstimate = await estimateRequestService.hasEstimateFromMover(userId);
      if (hasEstimate) {
        return res.status(409).json({
          success: false,
          message: "기사님이 견적을 제출한 경우 취소할 수 없습니다. 견적을 확인한 후 결정해주세요.",
        });
      }

      const active = await estimateRequestService.getActiveEstimateRequestByUserId(userId);
      if (!active) {
        return res.status(404).json({ success: false, message: "활성 견적 요청이 없습니다." });
      }

      if (active.status !== "PENDING" || hasEstimate) {
        return res.status(409).json({
          success: false,
          message: "진행중(PENDING) 상태에서만 취소할 수 있습니다.",
        });
      }

      await estimateRequestService.cancelActiveEstimateRequest(active.id);
      return res.status(200).json({ success: true, message: "견적 요청이 취소되었습니다." });
    } catch (error) {
      console.error("견적 요청 취소 에러:", error);
      const message = error instanceof Error ? error.message : "서버 내부 오류가 발생했습니다.";
      const status = error instanceof Error && error.message.includes("인증") ? 401 : 500;
      return res.status(status).json({ success: false, message });
    }
  }
}

export default EstimateRequestController;

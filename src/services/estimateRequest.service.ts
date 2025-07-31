import estimateRequestRepository from "../repositories/estimateRequest.repository";
import actionService from "./action.service";
import { ActionType } from "@prisma/client";
import {
  TCreateEstimateRequest,
  TUpdateEstimateRequest,
  IParsedAddressData,
  IDatabaseEstimateRequest,
  IUserTypeResult,
  IAddressInfoForService,
} from "../types/estimateRequest.types";
import { parseAddress } from "../utils/addressUtils";
import { EstimateRequest } from "@prisma/client";

class EstimateRequestService {
  async checkUserType(userId: string): Promise<IUserTypeResult> {
    return await estimateRequestRepository.checkUserType(userId);
  }

  async hasPendingRequest(userId: string): Promise<boolean> {
    return await estimateRequestRepository.hasPendingRequest(userId);
  }

  async hasEstimateFromMover(userId: string): Promise<boolean> {
    return await estimateRequestRepository.hasEstimateFromMover(userId);
  }

  async getActiveEstimateRequestByUserId(
    userId: string
  ): Promise<IDatabaseEstimateRequest | null> {
    return await estimateRequestRepository.getActiveEstimateRequestByUserId(
      userId
    );
  }

  private async processAddress(
    addressInfo: IAddressInfoForService
  ): Promise<{ id: string }> {
    const addressData: IParsedAddressData = parseAddress({
      roadAddress: addressInfo.roadAddress,
      detailAddress: addressInfo.detailAddress,
      zoneCode: addressInfo.zoneCode,
    });
    return await estimateRequestRepository.findOrCreateAddress(addressData);
  }

  async createEstimateRequest(
    params: TCreateEstimateRequest
  ): Promise<EstimateRequest> {
    const { userId, movingType, movingDate, departure, arrival, description } =
      params;

    const [fromAddress, toAddress] = await Promise.all([
      this.processAddress(departure),
      this.processAddress(arrival),
    ]);

    const estimateRequest =
      await estimateRequestRepository.createEstimateRequest(
        {
          moveType: movingType.toUpperCase(),
          moveDate: movingDate,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          description,
        },
        userId
      );

    // ESTIMATE_REQUEST_CREATE 액션 생성
    await actionService.createAction(
      userId,
      ActionType.ESTIMATE_REQUEST_CREATE,
      estimateRequest.id,
      "ESTIMATE_REQUEST",
      {}
    );

    return estimateRequest;
  }

  async updateActiveEstimateRequest(
    id: string,
    updateData: TUpdateEstimateRequest
  ): Promise<EstimateRequest> {
    const updatePayload: {
      moveType?: string;
      moveDate?: Date;
      fromAddressId?: string;
      toAddressId?: string;
      description?: string;
    } = {};

    if (updateData.movingType) {
      updatePayload.moveType = updateData.movingType.toUpperCase();
    }
    if (updateData.movingDate) {
      updatePayload.moveDate = new Date(updateData.movingDate);
    }
    if (updateData.description !== undefined) {
      updatePayload.description = updateData.description;
    }

    if (updateData.departure || updateData.arrival) {
      const currentRequest =
        await estimateRequestRepository.getEstimateRequestById(id);
      if (!currentRequest) {
        throw new Error("견적 요청을 찾을 수 없습니다.");
      }

      const oldFromAddressId = currentRequest.fromAddressId;
      const oldToAddressId = currentRequest.toAddressId;

      const addressPromises: Promise<{ id: string }>[] = [];

      if (updateData.departure) {
        addressPromises.push(this.processAddress(updateData.departure));
      }
      if (updateData.arrival) {
        addressPromises.push(this.processAddress(updateData.arrival));
      }

      const processedAddresses = await Promise.all(addressPromises);

      if (updateData.departure) {
        updatePayload.fromAddressId = processedAddresses[0].id;
      }
      if (updateData.arrival) {
        updatePayload.toAddressId =
          processedAddresses[updateData.departure ? 1 : 0].id;
      }

      const updatedRequest =
        await estimateRequestRepository.updateEstimateRequest(
          id,
          updatePayload
        );

      const deletePromises: Promise<void>[] = [];

      if (updateData.departure && oldFromAddressId) {
        deletePromises.push(
          estimateRequestRepository.softDeleteAddress(oldFromAddressId)
        );
      }
      if (updateData.arrival && oldToAddressId) {
        deletePromises.push(
          estimateRequestRepository.softDeleteAddress(oldToAddressId)
        );
      }

      await Promise.all(deletePromises);

      return updatedRequest;
    }

    return await estimateRequestRepository.updateEstimateRequest(
      id,
      updatePayload
    );
  }

  async cancelActiveEstimateRequest(id: string): Promise<EstimateRequest> {
    return await estimateRequestRepository.cancelEstimateRequest(id);
  }

  // 이사 완료 처리
  async completeEstimateRequest(id: string): Promise<EstimateRequest> {
    return await estimateRequestRepository.completeEstimateRequest(id);
  }
}

export default EstimateRequestService;

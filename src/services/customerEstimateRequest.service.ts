import customerEstimateRequestRepository from "../repositories/customerEstimateRequest.repository";
import actionService from "./action.service";
import { ActionType } from "@prisma/client";
import prisma from "../db/prisma/prisma";
import { NotFoundError } from "../types/commonError.types";
import {
  ServiceError,
  ServiceValidationError,
  ServiceDataProcessingError,
  RepositoryError,
} from "../types/errors.types";
import {
  EstimateRequestWithRelations,
  MultipleEstimateRequestWithRelations,
} from "../types/repository.types";
import {
  TPendingQuoteResponse,
  TReceivedQuoteResponse,
  TQuoteDetailResponse,
  TConfirmEstimateResponse,
  TDesignateEstimateRequest,
  TCancelEstimateResponse,
  TCompleteEstimateResponse,
} from "../types/customerEstimateRequest";

const customerEstimateRequestService = {
  // 1. 진행중인 견적요청 조회
  getPendingEstimateRequest: async (
    userId: string
  ): Promise<TPendingQuoteResponse> => {
    try {
      // 입력 검증
      if (!userId || typeof userId !== "string") {
        throw new ServiceValidationError("잘못된 사용자 ID입니다");
      }

      const activeEstimateRequestId =
        await customerEstimateRequestRepository.getActiveEstimateRequest(
          userId
        );

      if (!activeEstimateRequestId) {
        // 비즈니스 로직: 활성 견적요청이 없을 때의 처리
        return {
          estimateRequest: null,
          estimates: [],
        };
      }

      const rawData =
        await customerEstimateRequestRepository.getPendingEstimateRequest(
          activeEstimateRequestId,
          userId
        );

      if (!rawData) {
        // 비즈니스 로직: 데이터가 없을 때의 처리
        return {
          estimateRequest: null,
          estimates: [],
        };
      }

      // 비즈니스 로직: 데이터 변환 및 가공
      return await customerEstimateRequestService.transformPendingEstimateData(
        rawData
      );
    } catch (error) {
      if (error instanceof RepositoryError) {
        // Repository 에러를 Service 에러로 래핑
        throw new ServiceError(
          `진행중인 견적요청 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }
      throw error;
    }
  },

  // 비즈니스 로직: 진행중인 견적 데이터 변환
  transformPendingEstimateData: async (
    rawData: EstimateRequestWithRelations
  ): Promise<TPendingQuoteResponse> => {
    try {
      if (!rawData) {
        return {
          estimateRequest: null,
          estimates: [],
        };
      }

      // 기사님들의 찜 개수 일괄 조회
      const moverIds =
        rawData.estimates?.map((estimate) => estimate.mover.id) ?? [];
      const favoriteCounts =
        await customerEstimateRequestRepository.getMoversFavoriteCounts(
          moverIds
        );

      return {
        estimateRequest: {
          id: rawData.id,
          customerId: rawData.customerId,
          moveType: rawData.moveType,
          moveDate: rawData.moveDate,
          createdAt: rawData.createdAt,
          description: rawData.description,
          status: rawData.status,
          fromAddress: rawData.fromAddress,
          toAddress: rawData.toAddress,
        },
        estimates:
          rawData.estimates?.map((estimate) => ({
            id: estimate.id,
            price: estimate.price || 0, // null 체크 개선
            comment: estimate.comment,
            status: estimate.status,
            isDesignated: estimate.isDesignated,
            createdAt: estimate.createdAt,
            mover: {
              ...estimate.mover,
              // 비즈니스 로직: 찜 여부 계산
              isFavorite:
                estimate.mover.Favorite && estimate.mover.Favorite.length > 0,
              totalFavoriteCount: favoriteCounts[estimate.mover.id] ?? 0,
              Favorite: estimate.mover.Favorite ?? [],
            },
          })) ?? [],
      };
    } catch (error) {
      throw new ServiceDataProcessingError(
        "진행중인 견적 데이터 변환 실패",
        error
      );
    }
  },

  // 완료/확정된 견적요청 목록 조회 (EXPIRED, COMPLETED, APPROVED 상태 포함)
  getReceivedEstimateRequests: async (
    userId: string
  ): Promise<TReceivedQuoteResponse[]> => {
    try {
      // 입력 검증
      if (!userId || typeof userId !== "string") {
        throw new ServiceValidationError("잘못된 사용자 ID입니다");
      }

      const rawResult =
        await customerEstimateRequestRepository.getReceivedEstimateRequests(
          userId
        );

      if (!rawResult || rawResult.length === 0) {
        // 비즈니스 로직: 완료된 견적요청이 없을 때의 처리
        // APPROVED 상태도 포함되므로 빈 배열 반환으로 변경
        return [];
      }

      // 비즈니스 로직: 데이터 변환 및 가공
      return await customerEstimateRequestService.transformReceivedEstimateData(
        rawResult
      );
    } catch (error) {
      if (error instanceof RepositoryError) {
        // Repository 에러를 Service 에러로 래핑
        throw new ServiceError(
          `완료된 견적요청 조회 실패: ${error.message}`,
          undefined,
          error
        );
      }
      throw error;
    }
  },

  // 비즈니스 로직: 완료된 견적 데이터 변환
  transformReceivedEstimateData: async (
    rawData: MultipleEstimateRequestWithRelations
  ): Promise<TReceivedQuoteResponse[]> => {
    try {
      if (!rawData || rawData.length === 0) return [];

      // 모든 기사님들의 찜 개수 일괄 조회
      const allMoverIds = rawData.flatMap((request) =>
        request.estimates.map((estimate) => estimate.mover.id)
      );
      const favoriteCounts =
        await customerEstimateRequestRepository.getMoversFavoriteCounts(
          allMoverIds
        );

      return rawData.map((request) => ({
        estimateRequest: {
          id: request.id,
          customerId: request.customerId,
          moveType: request.moveType,
          moveDate: request.moveDate,
          createdAt: request.createdAt,
          description: request.description,
          status: request.status,
          fromAddress: request.fromAddress,
          toAddress: request.toAddress,
        },
        estimates: request.estimates.map((estimate) => ({
          id: estimate.id,
          price: estimate.price ?? 0,
          comment: estimate.comment,
          status: estimate.status,
          isDesignated: estimate.isDesignated,
          createdAt: estimate.createdAt || new Date(),
          mover: {
            ...estimate.mover,
            // 비즈니스 로직: 찜 여부 계산
            isFavorite:
              estimate.mover.Favorite && estimate.mover.Favorite.length > 0,
            totalFavoriteCount: favoriteCounts[estimate.mover.id] ?? 0,
            Favorite: estimate.mover.Favorite ?? [],
          },
        })),
      }));
    } catch (error) {
      throw new ServiceDataProcessingError(
        "완료된 견적 데이터 변환 실패",
        error
      );
    }
  },

  // 3. 견적 확정
  confirmEstimate: async (
    userId: string,
    estimateId: string
  ): Promise<TConfirmEstimateResponse> => {
    try {
      // 1. 진행중인 견적요청 확인
      const activeEstimateRequestId =
        await customerEstimateRequestRepository.getActiveEstimateRequest(
          userId
        );
      if (!activeEstimateRequestId) {
        throw new ServiceError("진행중인 견적요청이 없습니다.");
      }

      // 2. estimate가 해당 estimateRequest에 속하는지 확인
      const estimate =
        await customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          activeEstimateRequestId
        );
      if (!estimate) {
        throw new NotFoundError(
          "현재 진행중인 견적요청에 대한 기사님들의 견적서가 존재하지 않습니다."
        );
      }

      // 3. 이미 확정된 견적요청인지 확인
      const estimateRequest =
        await customerEstimateRequestRepository.getEstimateRequestById(
          activeEstimateRequestId
        );
      if (!estimateRequest) {
        throw new NotFoundError("견적요청을 찾을 수 없습니다.");
      }
      if (
        estimateRequest.status === "APPROVED" ||
        estimateRequest.status === "COMPLETED"
      ) {
        throw new ServiceValidationError("이미 확정된 견적요청입니다.");
      }

      // 4. 비즈니스 로직: 트랜잭션으로 견적 확정 처리
      const result =
        await customerEstimateRequestService.executeConfirmEstimateTransaction(
          activeEstimateRequestId,
          estimateId
        );

      if (!result) {
        throw new NotFoundError("견적 확정에 실패했습니다.");
      }
      return result;
    } catch (error) {
      if (error instanceof RepositoryError) {
        // Repository 에러를 Service 에러로 래핑
        throw new ServiceError(
          `견적 확정 실패: ${error.message}`,
          undefined,
          error
        );
      }
      throw error;
    }
  },

  // 비즈니스 로직: 견적 확정 트랜잭션 처리
  executeConfirmEstimateTransaction: async (
    estimateRequestId: string,
    estimateId: string
  ): Promise<TConfirmEstimateResponse> => {
    try {
      // 견적 상세 정보 조회 (액션 생성용)
      const estimateDetail =
        await customerEstimateRequestRepository.getEstimateDetailForAction(
          estimateId
        );

      // Prisma 트랜잭션으로 견적 확정 처리
      const result = await prisma.$transaction(async (tx) => {
        // 1. 견적요청 상태를 APPROVED로 변경
        const confirmedEstimateRequest = await tx.estimateRequest.update({
          where: { id: estimateRequestId },
          data: { status: "APPROVED" },
          include: {
            fromAddress: true,
            toAddress: true,
          },
        });

        // 2. 선택된 견적 상태를 ACCEPTED로 변경
        const acceptedEstimate = await tx.estimate.update({
          where: { id: estimateId },
          data: { status: "ACCEPTED" },
        });

        // 3. 나머지 견적들을 AUTO_REJECTED로 변경
        await tx.estimate.updateMany({
          where: {
            estimateRequestId: estimateRequestId,
            id: { not: estimateId },
          },
          data: { status: "AUTO_REJECTED" },
        });

        return {
          estimateRequest: {
            id: confirmedEstimateRequest.id,
            customerId: confirmedEstimateRequest.customerId,
            moveType: confirmedEstimateRequest.moveType,
            moveDate: confirmedEstimateRequest.moveDate,
            createdAt: confirmedEstimateRequest.createdAt,
            description: confirmedEstimateRequest.description,
            status: confirmedEstimateRequest.status,
            fromAddress: confirmedEstimateRequest.fromAddress,
            toAddress: confirmedEstimateRequest.toAddress,
          },
          estimate: acceptedEstimate,
        };
      });

      // 4. AUTO_REJECTED된 견적들에 대한 액션 생성
      const otherEstimates =
        await customerEstimateRequestRepository.getAutoRejectedEstimates(
          estimateRequestId,
          estimateId
        );

      for (const otherEstimate of otherEstimates) {
        const otherEstimateDetail =
          await customerEstimateRequestRepository.getEstimateDetailForAction(
            otherEstimate.id
          );

        if (otherEstimateDetail) {
          const otherActionType = otherEstimateDetail.isDesignated
            ? ActionType.DESIGNATED_ESTIMATE_REJECTED
            : ActionType.ESTIMATE_REJECTED;

          await actionService.createAction(
            otherEstimateDetail.moverId,
            otherActionType,
            otherEstimate.id,
            otherEstimateDetail.isDesignated
              ? "DESIGNATED_ESTIMATE"
              : "ESTIMATE",
            {
              customerName:
                otherEstimateDetail.estimateRequest?.customer?.name || "",
              moveType: otherEstimateDetail.estimateRequest?.moveType || "",
            }
          );
        }
      }

      // 5. 견적 확정 액션 생성
      if (estimateDetail) {
        const actionType = estimateDetail.isDesignated
          ? ActionType.DESIGNATED_ESTIMATE_ACCEPTED
          : ActionType.ESTIMATE_ACCEPTED;

        await actionService.createAction(
          estimateDetail.moverId,
          actionType,
          estimateId,
          estimateDetail.isDesignated ? "DESIGNATED_ESTIMATE" : "ESTIMATE",
          {
            moverName: estimateDetail.mover?.name || "",
            customerName: estimateDetail.estimateRequest?.customer?.name || "",
            moveType: estimateDetail.estimateRequest?.moveType || "",
            estimateRequestId: estimateDetail.estimateRequestId,
            estimateId: estimateId,
          }
        );
      }

      return result;
    } catch (error) {
      throw new ServiceError(
        `견적 확정 트랜잭션 실패: ${error instanceof Error ? error.message : "Unknown error"}`,
        undefined,
        error
      );
    }
  },

  // 4. 견적 취소
  cancelEstimate: async (
    userId: string,
    estimateId: string
  ): Promise<TCancelEstimateResponse | null> => {
    try {
      // 1. 진행중인 견적요청 확인
      const activeEstimateRequestId =
        await customerEstimateRequestRepository.getActiveEstimateRequest(
          userId
        );
      if (!activeEstimateRequestId) {
        throw new ServiceError("진행중인 견적요청이 없습니다.");
      }
      // 2. estimate가 해당 estimateRequest에 속하는지 확인
      const estimate =
        await customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          activeEstimateRequestId
        );
      if (!estimate) {
        throw new NotFoundError(
          "현재 진행중인 견적요청에 대한 기사님들의 견적서가 존재하지 않습니다."
        );
      }
      // 3. 이미 확정된 견적요청인지 확인
      const estimateRequest =
        await customerEstimateRequestRepository.getEstimateRequestById(
          activeEstimateRequestId
        );
      if (!estimateRequest) {
        throw new NotFoundError("견적요청을 찾을 수 없습니다.");
      }
      if (
        estimateRequest.status === "APPROVED" ||
        estimateRequest.status === "COMPLETED"
      ) {
        throw new ServiceValidationError("이미 확정된 견적요청입니다.");
      }

      // 4. 견적 상세 정보 조회 (액션 생성용)
      const estimateDetail =
        await customerEstimateRequestRepository.getEstimateDetailForAction(
          estimateId
        );

      // 5. 비즈니스 로직: 견적 취소 처리
      const result =
        await customerEstimateRequestRepository.updateEstimateStatus(
          estimateId,
          "REJECTED"
        );

      if (!result) {
        throw new NotFoundError("견적 취소에 실패했습니다.");
      }

      // 6. 견적 취소 액션 생성
      if (estimateDetail) {
        const actionType = estimateDetail.isDesignated
          ? ActionType.DESIGNATED_ESTIMATE_REJECTED
          : ActionType.ESTIMATE_REJECTED;

        await actionService.createAction(
          estimateDetail.moverId,
          actionType,
          estimateId,
          estimateDetail.isDesignated ? "DESIGNATED_ESTIMATE" : "ESTIMATE",
          {
            customerName: estimateDetail.estimateRequest?.customer?.name || "",
            moveType: estimateDetail.estimateRequest?.moveType || "",
          }
        );
      }

      return result;
    } catch (error) {
      if (error instanceof RepositoryError) {
        // Repository 에러를 Service 에러로 래핑
        throw new ServiceError(
          `견적 취소 실패: ${error.message}`,
          undefined,
          error
        );
      }
      throw error;
    }
  },

  // 5. 이사완료(구매확정)
  completeEstimate: async (
    userId: string,
    estimateId: string
  ): Promise<TCompleteEstimateResponse | null> => {
    try {
      // 1. estimate로부터 estimateRequestId 조회
      const estimateData =
        await customerEstimateRequestRepository.getEstimateById(estimateId);
      if (!estimateData) {
        throw new NotFoundError("견적을 찾을 수 없습니다.");
      }

      const estimateRequestId = estimateData.estimateRequestId;

      // 2. 해당 견적요청이 사용자의 것인지 확인
      const estimateRequestData =
        await customerEstimateRequestRepository.getEstimateRequestById(
          estimateRequestId
        );
      if (!estimateRequestData || estimateRequestData.customerId !== userId) {
        throw new ServiceError("해당 견적요청에 대한 권한이 없습니다.");
      }

      // 3. estimate가 해당 estimateRequest에 속하는지 확인
      const estimate =
        await customerEstimateRequestRepository.getEstimateByIdAndRequestId(
          estimateId,
          estimateRequestId
        );
      if (!estimate) {
        throw new NotFoundError(
          "해당 견적요청에 대한 기사님들의 견적서가 존재하지 않습니다."
        );
      }

      // 4. 견적 상세 정보 조회 (액션 생성용)
      const estimateDetail =
        await customerEstimateRequestRepository.getEstimateDetailForAction(
          estimateId
        );

      // 5. 비즈니스 로직: 이사완료 처리
      const result =
        await customerEstimateRequestRepository.updateEstimateRequestStatus(
          estimateRequestId,
          "COMPLETED"
        );

      if (!result) {
        throw new NotFoundError("이사완료에 실패했습니다.");
      }

      // 주소 정보를 포함하여 반환
      const estimateRequestWithAddresses =
        await prisma.estimateRequest.findUnique({
          where: { id: estimateRequestId },
          include: {
            fromAddress: true,
            toAddress: true,
          },
        });

      if (!estimateRequestWithAddresses) {
        throw new NotFoundError("견적요청을 찾을 수 없습니다.");
      }

      // 6. 이사 완료 후 리뷰 요청 액션 생성 (다음날 리뷰 요청)
      if (estimateDetail) {
        await actionService.createAction(
          estimateDetail.moverId,
          ActionType.MOVE_DAY_REVIEW_REQUEST,
          estimateId,
          estimateDetail.isDesignated ? "DESIGNATED_ESTIMATE" : "ESTIMATE",
          {
            moverName: estimateDetail.mover?.name || "",
            moveType: estimateDetail.estimateRequest?.moveType || "",
          }
        );
      }

      return {
        estimateRequest: {
          id: estimateRequestWithAddresses.id,
          customerId: estimateRequestWithAddresses.customerId,
          moveType: estimateRequestWithAddresses.moveType,
          moveDate: estimateRequestWithAddresses.moveDate,
          createdAt: estimateRequestWithAddresses.createdAt,
          description: estimateRequestWithAddresses.description,
          status: estimateRequestWithAddresses.status,
          fromAddress: estimateRequestWithAddresses.fromAddress,
          toAddress: estimateRequestWithAddresses.toAddress,
        },
      };
    } catch (error) {
      if (error instanceof RepositoryError) {
        // Repository 에러를 Service 에러로 래핑
        throw new ServiceError(
          `이사완료 실패: ${error.message}`,
          undefined,
          error
        );
      }
      throw error;
    }
  },
};

export default customerEstimateRequestService;

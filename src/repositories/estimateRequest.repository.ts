import {
  PrismaClient,
  RequestStatus,
  EstimateRequest,
  UserType,
  MoveType,
  RegionType,
} from "@prisma/client";
import { getCurrentDateString } from "../utils/dateUtils";
import {
  IParsedAddressData,
  IDatabaseEstimateRequest,
  TCreateEstimateRequestData,
  TUpdateEstimateRequestData,
  IUserTypeResult,
} from "../types/estimateRequest.types";

const prisma = new PrismaClient();

const createEstimateRequest = async (
  data: TCreateEstimateRequestData,
  userId: string
): Promise<EstimateRequest> => {
  return await prisma.estimateRequest.create({
    data: {
      customerId: userId,
      moveType: data.moveType as MoveType,
      moveDate: new Date(data.moveDate),
      fromAddressId: data.fromAddressId,
      toAddressId: data.toAddressId,
      status: RequestStatus.PENDING,
      description: data.description,
    },
  });
};

const getActiveEstimateRequestByUserId = async (
  userId: string
): Promise<IDatabaseEstimateRequest | null> => {
  const request = await prisma.estimateRequest.findFirst({
    where: {
      customerId: userId,
      status: RequestStatus.PENDING,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerId: true,
      moveType: true,
      moveDate: true,
      fromAddressId: true,
      toAddressId: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      fromAddress: {
        select: {
          zoneCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
          deletedAt: true,
        },
      },
      toAddress: {
        select: {
          zoneCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
          deletedAt: true,
        },
      },
    },
  });

  if (request) {
    if (request.fromAddress && request.fromAddress.deletedAt) {
      (request as any).fromAddress = undefined;
    }
    if (request.toAddress && request.toAddress.deletedAt) {
      (request as any).toAddress = undefined;
    }
  }

  return request;
};

const getEstimateRequestById = async (
  id: string
): Promise<IDatabaseEstimateRequest | null> => {
  return await prisma.estimateRequest.findUnique({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      customerId: true,
      moveType: true,
      moveDate: true,
      fromAddressId: true,
      toAddressId: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      fromAddress: {
        select: {
          zoneCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
          deletedAt: true,
        },
      },
      toAddress: {
        select: {
          zoneCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
          deletedAt: true,
        },
      },
    },
  });
};

const updateEstimateRequest = async (
  id: string,
  updateData: TUpdateEstimateRequestData
): Promise<EstimateRequest> => {
  const prismaUpdateData: {
    moveType?: MoveType;
    moveDate?: Date;
    fromAddressId?: string;
    toAddressId?: string;
    description?: string;
  } = {};

  if (updateData.moveType) {
    prismaUpdateData.moveType = updateData.moveType as MoveType;
  }
  if (updateData.moveDate) {
    prismaUpdateData.moveDate = updateData.moveDate;
  }
  if (updateData.fromAddressId) {
    prismaUpdateData.fromAddressId = updateData.fromAddressId;
  }
  if (updateData.toAddressId) {
    prismaUpdateData.toAddressId = updateData.toAddressId;
  }
  if (updateData.description !== undefined) {
    prismaUpdateData.description = updateData.description;
  }

  return await prisma.estimateRequest.update({
    where: { id },
    data: prismaUpdateData,
  });
};

const cancelEstimateRequest = async (id: string): Promise<EstimateRequest> => {
  const todayDateOnly = new Date(getCurrentDateString());

  return await prisma.$transaction(async (tx) => {
    const request = await tx.estimateRequest.findUnique({
      where: { id },
      select: { fromAddressId: true, toAddressId: true },
    });

    if (!request) {
      throw new Error("견적 요청을 찾을 수 없습니다.");
    }

    const cancelledRequest = await tx.estimateRequest.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
        deletedAt: todayDateOnly,
      },
    });

    await Promise.all([
      tx.address.update({
        where: { id: request.fromAddressId },
        data: { deletedAt: todayDateOnly },
      }),
      tx.address.update({
        where: { id: request.toAddressId },
        data: { deletedAt: todayDateOnly },
      }),
    ]);

    return cancelledRequest;
  });
};

const hasPendingRequest = async (userId: string): Promise<boolean> => {
  const request = await prisma.estimateRequest.findFirst({
    where: {
      customerId: userId,
      status: RequestStatus.PENDING,
      deletedAt: null,
    },
  });
  return !!request;
};

const hasEstimateFromMover = async (userId: string): Promise<boolean> => {
  const request = await prisma.estimateRequest.findFirst({
    where: {
      customerId: userId,
      status: RequestStatus.PENDING,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!request) return false;

  const estimate = await prisma.estimate.findFirst({
    where: {
      estimateRequestId: request.id,
      deletedAt: null,
    },
  });
  return !!estimate;
};

const findOrCreateAddress = async (
  addressData: IParsedAddressData
): Promise<{ id: string }> => {
  const createData = {
    zoneCode: addressData.zoneCode,
    city: addressData.city,
    district: addressData.district,
    region: addressData.region as RegionType,
    detail:
      addressData.detail === null ||
      addressData.detail === undefined ||
      addressData.detail === ""
        ? null
        : addressData.detail,
  };

  const address = await prisma.address.create({
    data: createData,
  });

  return { id: address.id };
};

const softDeleteAddress = async (addressId: string): Promise<void> => {
  const todayDateOnly = new Date(getCurrentDateString());

  await prisma.address.update({
    where: { id: addressId },
    data: { deletedAt: todayDateOnly },
  });
};

const checkUserType = async (userId: string): Promise<IUserTypeResult> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true, isCustomer: true, isMover: true },
  });

  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const isCustomer =
    user.userType.includes(UserType.CUSTOMER) || user.isCustomer === true;
  const isMover =
    user.userType.includes(UserType.MOVER) || user.isMover === true;

  return { isCustomer, isMover };
};

// 견적 요청 상세 정보 조회 (액션 메타데이터용)
const getEstimateRequestDetailForAction = async (estimateRequestId: string) => {
  const estimateRequest = await prisma.estimateRequest.findUnique({
    where: { id: estimateRequestId },
    select: {
      id: true,
      customerId: true,
      moveType: true,
      moveDate: true,
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return estimateRequest;
};

// 이사 완료 처리를 위한 견적 요청 상세 조회
const getEstimateRequestDetailForCompletion = async (
  estimateRequestId: string
) => {
  const estimateRequest = await prisma.estimateRequest.findUnique({
    where: { id: estimateRequestId },
    select: {
      id: true,
      customerId: true,
      moveType: true,
      moveDate: true,
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      estimates: {
        where: {
          status: "ACCEPTED",
          isDesignated: true,
        },
        select: {
          id: true,
          moverId: true,
          mover: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  return estimateRequest;
};

// 견적 요청의 출발지 정보 조회 (액션 메타데이터용)
const getEstimateRequestAddressInfo = async (estimateRequestId: string) => {
  const estimateRequest = await prisma.estimateRequest.findUnique({
    where: { id: estimateRequestId },
    select: {
      fromAddress: {
        select: {
          region: true,
          district: true,
        },
      },
    },
  });
  return estimateRequest?.fromAddress;
};

// 이사일 알림을 위한 견적 요청 조회 (스케줄러용)
const getEstimateRequestsForMoveDayReminders = async (moveDate: Date) => {
  const estimateRequests = await prisma.estimateRequest.findMany({
    where: {
      moveDate: {
        gte: new Date(moveDate.setHours(0, 0, 0, 0)),
        lt: new Date(moveDate.setHours(23, 59, 59, 999)),
      },
      status: "COMPLETED",
      estimates: {
        some: {
          status: "ACCEPTED",
          isDesignated: true,
        },
      },
    },
    select: {
      id: true,
      customerId: true,
      moveType: true,
      moveDate: true,
      estimates: {
        where: {
          status: "ACCEPTED",
          isDesignated: true,
        },
        select: {
          id: true,
          moverId: true,
          mover: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  return estimateRequests;
};

// 리뷰 요청을 위한 견적 요청 조회 (스케줄러용)
const getEstimateRequestsForReviewRequests = async () => {
  const today = new Date();
  const estimateRequests = await prisma.estimateRequest.findMany({
    where: {
      moveDate: {
        lt: today, // 이사 날짜가 오늘보다 이전
      },
      status: "COMPLETED",
      review: null,
      estimates: {
        some: {
          status: "ACCEPTED",
          isDesignated: true,
        },
      },
    },
    select: {
      id: true,
      customerId: true,
      moveType: true,
      moveDate: true,
      estimates: {
        where: {
          status: "ACCEPTED",
          isDesignated: true,
        },
        select: {
          id: true,
          moverId: true,
          mover: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  return estimateRequests;
};

// 이사 완료 처리 함수
const completeEstimateRequest = async (
  id: string
): Promise<EstimateRequest> => {
  return await prisma.estimateRequest.update({
    where: { id },
    data: {
      status: RequestStatus.COMPLETED,
    },
  });
};

const estimateRequestRepository = {
  createEstimateRequest,
  getActiveEstimateRequestByUserId,
  getEstimateRequestById,
  updateEstimateRequest,
  cancelEstimateRequest,
  completeEstimateRequest,
  hasPendingRequest,
  hasEstimateFromMover,
  findOrCreateAddress,
  softDeleteAddress,
  checkUserType,
  getEstimateRequestDetailForAction,
  getEstimateRequestDetailForCompletion,
  getEstimateRequestAddressInfo,
  getEstimateRequestsForMoveDayReminders,
  getEstimateRequestsForReviewRequests,
};

export default estimateRequestRepository;

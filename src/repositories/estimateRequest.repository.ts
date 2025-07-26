import { PrismaClient, RequestStatus, EstimateRequest, UserType, MoveType, RegionType } from "@prisma/client";
import {
  IParsedAddressData,
  IDatabaseEstimateRequest,
  TCreateEstimateRequestData,
  TUpdateEstimateRequestData,
  IUserTypeResult,
} from "../types/estimateRequest.types";

const prisma = new PrismaClient();

const createEstimateRequest = async (data: TCreateEstimateRequestData, userId: string): Promise<EstimateRequest> => {
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

const getActiveEstimateRequestByUserId = async (userId: string): Promise<IDatabaseEstimateRequest | null> => {
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
          postalCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
          deletedAt: true,
        },
      },
      toAddress: {
        select: {
          postalCode: true,
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

const getEstimateRequestById = async (id: string): Promise<IDatabaseEstimateRequest | null> => {
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
          postalCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
          deletedAt: true,
        },
      },
      toAddress: {
        select: {
          postalCode: true,
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

const updateEstimateRequest = async (id: string, updateData: TUpdateEstimateRequestData): Promise<EstimateRequest> => {
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
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

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

const findOrCreateAddress = async (addressData: IParsedAddressData): Promise<{ id: string }> => {
  const createData = {
    postalCode: addressData.postalCode,
    city: addressData.city,
    district: addressData.district,
    region: addressData.region as RegionType,
    detail:
      addressData.detail === null || addressData.detail === undefined || addressData.detail === ""
        ? null
        : addressData.detail,
  };

  const address = await prisma.address.create({
    data: createData,
  });

  return { id: address.id };
};

const softDeleteAddress = async (addressId: string): Promise<void> => {
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

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

  const isCustomer = user.userType.includes(UserType.CUSTOMER) || user.isCustomer === true;
  const isMover = user.userType.includes(UserType.MOVER) || user.isMover === true;

  return { isCustomer, isMover };
};

export default {
  createEstimateRequest,
  getActiveEstimateRequestByUserId,
  getEstimateRequestById,
  updateEstimateRequest,
  cancelEstimateRequest,
  hasPendingRequest,
  hasEstimateFromMover,
  findOrCreateAddress,
  softDeleteAddress,
  checkUserType,
};

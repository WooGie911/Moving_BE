import {
  PrismaClient,
  MoveType,
  RequestStatus,
  EstimateRequest,
  UserType,
} from "@prisma/client";
import { getKoreaToday } from "../utils/dateUtils";

const prisma = new PrismaClient();

const createEstimateRequest = async (
  data: any,
  userId: string
): Promise<EstimateRequest> => {
  return await prisma.estimateRequest.create({
    data: {
      customerId: userId,
      moveType: data.moveType,
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
): Promise<any | null> => {
  return await prisma.estimateRequest.findFirst({
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
      fromAddress: {
        select: {
          postalCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
        },
      },
      toAddress: {
        select: {
          postalCode: true,
          city: true,
          district: true,
          detail: true,
          region: true,
        },
      },
    },
  });
};

const getEstimateRequestById = async (id: string): Promise<any | null> => {
  return await prisma.estimateRequest.findUnique({
    where: { id },
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
    },
  });
};
const updateEstimateRequest = async (
  id: string,
  updateData: any
): Promise<EstimateRequest> => {
  return await prisma.estimateRequest.update({
    where: { id },
    data: updateData,
  });
};
const cancelEstimateRequest = async (id: string): Promise<EstimateRequest> => {
  // 한국 시간 기준으로 삭제한 날짜만 저장 (시간은 00:00:00)
  const koreaToday = getKoreaToday();

  return await prisma.estimateRequest.update({
    where: { id },
    data: { status: RequestStatus.CANCELLED, deletedAt: koreaToday },
  });
};
const hasPendingRequest = async (userId: string): Promise<boolean> => {
  const req = await prisma.estimateRequest.findFirst({
    where: {
      customerId: userId,
      status: RequestStatus.PENDING,
      deletedAt: null,
    },
  });
  return !!req;
};
const isActiveRequestPending = async (userId: string): Promise<boolean> => {
  const req = await prisma.estimateRequest.findFirst({
    where: {
      customerId: userId,
      status: RequestStatus.PENDING,
      deletedAt: null,
    },
  });
  return !!req;
};
const hasEstimateFromMover = async (userId: string): Promise<boolean> => {
  const req = await prisma.estimateRequest.findFirst({
    where: {
      customerId: userId,
      status: RequestStatus.PENDING,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!req) return false;
  const estimate = await prisma.estimate.findFirst({
    where: { estimateRequestId: req.id, deletedAt: null },
  });
  return !!estimate;
};
const findOrCreateAddress = async ({
  city,
  district,
  detail,
  region,
}: {
  city: string;
  district: string;
  detail?: string;
  region: string;
}) => {
  // region enum 변환
  // Prisma의 $Enums.RegionType을 import하지 않고, prisma.address의 타입 추론을 활용
  let address = await prisma.address.findFirst({
    where: { city, district, detail, region: region as any },
  });
  if (!address) {
    // 우편번호는 나중에 업데이트하거나 빈 문자열로 설정
    address = await prisma.address.create({
      data: { city, district, detail, region: region as any, postalCode: "" },
    });
  }
  return address;
};

// 유저의 유형을 확인하는 메서드
const checkUserType = async (
  userId: string
): Promise<{ isCustomer: boolean; isMover: boolean }> => {
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

// 이사일이 지난 견적 요청을 만료 처리하는 메서드
const expireOverdueRequests = async (today: Date): Promise<void> => {
  await prisma.estimateRequest.updateMany({
    where: {
      moveDate: {
        lt: today, // 이사일이 오늘보다 이전
      },
      status: RequestStatus.PENDING, // PENDING 상태인 것만
      deletedAt: null,
    },
    data: {
      status: RequestStatus.EXPIRED,
      updatedAt: new Date(),
    },
  });
};

// 견적 요청이 만료되었는지 확인하는 메서드
const isRequestExpired = async (
  estimateRequestId: string
): Promise<boolean> => {
  const request = await prisma.estimateRequest.findUnique({
    where: { id: estimateRequestId },
    select: { moveDate: true, status: true },
  });

  if (!request) {
    return false;
  }

  const koreaToday = getKoreaToday();
  return (
    request.moveDate < koreaToday || request.status === RequestStatus.EXPIRED
  );
};

export default {
  createEstimateRequest,
  getActiveEstimateRequestByUserId,
  getEstimateRequestById,
  updateEstimateRequest,
  cancelEstimateRequest,
  hasPendingRequest,
  isActiveRequestPending,
  hasEstimateFromMover,
  findOrCreateAddress,
  checkUserType,
  expireOverdueRequests,
  isRequestExpired,
};

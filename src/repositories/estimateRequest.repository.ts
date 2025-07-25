import {
  PrismaClient,
  MoveType,
  RequestStatus,
  EstimateRequest,
} from "@prisma/client";

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
          city: true,
          district: true,
          detail: true,
          region: true,
        },
      },
      toAddress: {
        select: {
          city: true,
          district: true,
          detail: true,
          region: true,
        },
      },
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
  return await prisma.estimateRequest.update({
    where: { id },
    data: { status: RequestStatus.CANCELLED, deletedAt: new Date() },
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
    address = await prisma.address.create({
      data: { city, district, detail, region: region as any, postalCode: "" },
    });
  }
  return address;
};
export default {
  createEstimateRequest,
  getActiveEstimateRequestByUserId,
  updateEstimateRequest,
  cancelEstimateRequest,
  hasPendingRequest,
  isActiveRequestPending,
  hasEstimateFromMover,
  findOrCreateAddress,
};

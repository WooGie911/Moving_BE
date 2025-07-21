import { PrismaClient, MoveType, RequestStatus, EstimateRequest } from "@prisma/client";

const prisma = new PrismaClient();

const createEstimateRequest = async (data: any, userId: string): Promise<EstimateRequest> => {
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
const getActiveEstimateRequestByUserId = async (userId: string): Promise<EstimateRequest | null> => {
  return await prisma.estimateRequest.findFirst({
    where: {
      customerId: userId,
      status: RequestStatus.PENDING,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
};
const updateEstimateRequest = async (id: string, updateData: any): Promise<EstimateRequest> => {
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
    where: { customerId: userId, status: RequestStatus.PENDING, deletedAt: null },
  });
  return !!req;
};
const isActiveRequestPending = async (userId: string): Promise<boolean> => {
  const req = await prisma.estimateRequest.findFirst({
    where: { customerId: userId, status: RequestStatus.PENDING, deletedAt: null },
  });
  return !!req;
};
const hasEstimateFromMover = async (userId: string): Promise<boolean> => {
  const req = await prisma.estimateRequest.findFirst({
    where: { customerId: userId, status: RequestStatus.PENDING, deletedAt: null },
    select: { id: true },
  });
  if (!req) return false;
  const estimate = await prisma.estimate.findFirst({
    where: { estimateRequestId: req.id, deletedAt: null },
  });
  return !!estimate;
};
export default {
  createEstimateRequest,
  getActiveEstimateRequestByUserId,
  updateEstimateRequest,
  cancelEstimateRequest,
  hasPendingRequest,
  isActiveRequestPending,
  hasEstimateFromMover,
};

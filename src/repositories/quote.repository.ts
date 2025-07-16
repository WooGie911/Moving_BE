import { PrismaClient, MovingType, Region, Prisma, Quote } from "@prisma/client";
import { IBackendQuoteData, IBackendUpdateQuoteData } from "../types/quote.types";

const prisma = new PrismaClient();

const createQuote = async (quoteData: IBackendQuoteData, userId: number): Promise<Quote> => {
  return await prisma.quote.create({
    data: {
      userId,
      movingType: quoteData.movingType,
      departureAddr: quoteData.departureAddress,
      arrivalAddr: quoteData.arrivalAddress,
      departureDetail: quoteData.departureDetail,
      arrivalDetail: quoteData.arrivalDetail,
      departureRegion: quoteData.departureRegion,
      arrivalRegion: quoteData.arrivalRegion,
      movingDate: new Date(quoteData.movingDate),
      description: quoteData.description,
      status: "ACTIVE",
    },
  });
};

const getActiveQuoteByUserId = async (userId: number): Promise<Quote | null> => {
  return await prisma.quote.findFirst({
    where: {
      userId,
      status: {
        in: ["ACTIVE", "CONFIRMED"],
      },
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getQuoteById = async (quoteId: number): Promise<Quote | null> => {
  return await prisma.quote.findFirst({
    where: {
      id: quoteId,
      deletedAt: null,
    },
  });
};

const updateQuote = async (quoteId: number, updateData: IBackendUpdateQuoteData): Promise<Quote> => {
  const updateFields: Prisma.QuoteUpdateInput = {};

  if (updateData.movingType) updateFields.movingType = updateData.movingType;
  if (updateData.departureAddress) updateFields.departureAddr = updateData.departureAddress;
  if (updateData.arrivalAddress) updateFields.arrivalAddr = updateData.arrivalAddress;
  if (updateData.departureDetail !== undefined) updateFields.departureDetail = updateData.departureDetail;
  if (updateData.arrivalDetail !== undefined) updateFields.arrivalDetail = updateData.arrivalDetail;
  if (updateData.departureRegion !== undefined) updateFields.departureRegion = updateData.departureRegion;
  if (updateData.arrivalRegion !== undefined) updateFields.arrivalRegion = updateData.arrivalRegion;
  if (updateData.movingDate) updateFields.movingDate = new Date(updateData.movingDate);
  if (updateData.description !== undefined) updateFields.description = updateData.description;

  return await prisma.quote.update({
    where: { id: quoteId },
    data: updateFields,
  });
};

const cancelQuote = async (quoteId: number): Promise<Quote> => {
  return await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: "CANCELLED",
      deletedAt: new Date(),
    },
  });
};

export default {
  createQuote,
  getActiveQuoteByUserId,
  getQuoteById,
  updateQuote,
  cancelQuote,
};

import prisma from "../db/prisma/prisma";
import { ActionType } from "@prisma/client";

interface CreateActionParams {
  userId: number;
  type: ActionType;
  entityId: number;
  entityType: string;
  metadata: object;
}

const actionRepository = {
  createAction: async (params: CreateActionParams) => {
    return prisma.action.create({
      data: {
        userId: params.userId,
        type: params.type,
        entityId: params.entityId,
        entityType: params.entityType,
        metadata: params.metadata,
      },
    });
  },
};

export default actionRepository;

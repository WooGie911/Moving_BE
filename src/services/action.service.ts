import { ActionType } from "@prisma/client";
import actionRepository from "../repositories/action.repository";

const actionService = {
  createAction: async (
    userId: number,
    type: ActionType,
    entityId: number,
    entityType: string,
    metadata: object
  ) => {
    return actionRepository.createAction({
      userId,
      type,
      entityId,
      entityType,
      metadata,
    });
  },
};

export default actionService; 
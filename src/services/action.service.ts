import { ActionType } from "@prisma/client";
import actionRepository from "../repositories/action.repository";

const actionService = {
  createAction: async (
    userId: string,
    type: ActionType,
    entityId: string,
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

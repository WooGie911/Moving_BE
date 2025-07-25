import { Action, ActionType, MoveType, NotificationType } from "@prisma/client";
import prisma from "../db/prisma/prisma";
import { IActionMetadata } from "../types/notification.types";

export interface INotificationPayload {
  type: NotificationType;
  getReceivers: (
    action: Action
  ) => Promise<{ id: string; userType: "CUSTOMER" | "MOVER" }[]>;
  buildMessage: (
    action: Action,
    userType: "CUSTOMER" | "MOVER"
  ) => {
    title: string;
    content: string;
    path: string;
  };
}

export const actionNotificationMap: Record<ActionType, INotificationPayload> = {
  WELCOME: {
    type: NotificationType.WELCOME,
    getReceivers: async (action: Action) => [
      { id: action.userId, userType: "CUSTOMER" },
    ],
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => ({
      title: '<span class="font-bold">회원가입</span>을 환영합니다!',
      content: "서비스 이용을 시작해보세요.",
      path: "/",
    }),
  },
  ESTIMATE_REQUEST_CREATE: {
    type: NotificationType.ESTIMATE_REQUEST_ARRIVED,
    getReceivers: async (action: Action) => {
      // // TODO: 출발지 정보(region, district)를 사용하여 필터링
      // const estimateRequest = await prisma.estimateRequest.findUnique({
      //   where: { id: action.entityId },
      //   select: { fromAddress: true },
      // });
      // const fromRegion = estimateRequest?.fromAddress?.region;
      // const fromDistrict = estimateRequest?.fromAddress?.district;

      const movers = await prisma.user.findMany({
        where: {
          userType: {
            has: "MOVER",
          },
          id: {
            not: action.userId,
          },
          // TODO: 출발지 정보(region, district)를 사용하여 필터링
          // serviceAreas: {
          //   some: {
          //     region: fromRegion,
          //     district: fromDistrict,
          //   },
          // },
        },
        select: { id: true },
      });
      return movers.map((mover) => ({ id: mover.id, userType: "MOVER" }));
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => ({
      title: "새 견적 요청이 등록되었습니다.",
      content: "새로운 견적 요청이 등록되었습니다.",
      path: `/estimateRequests/${action.entityId}`,
    }),
  },
  ESTIMATE_SUBMITTED: {
    type: NotificationType.ESTIMATE_ARRIVED,
    getReceivers: async (action: Action) => {
      return [{ id: action.userId, userType: "CUSTOMER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moverName = "" } = (action.metadata as IActionMetadata) || {};
      return {
        title: `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">견적</span>이 도착했어요.`,
        content: "새로운 견적이 도착했습니다.",
        path: `/estimateRequests/${action.entityId}`,
      };
    },
  },
  ESTIMATE_ACCEPTED: {
    type: NotificationType.ESTIMATE_STATUS_UPDATED,
    getReceivers: async (action: Action) => {
      let moverId: string | undefined;
      let customerId: string | undefined;
      if (action.entityType === "ESTIMATE") {
        const estimate = await prisma.estimate.findUnique({
          where: { id: action.entityId },
          select: {
            moverId: true,
            estimateRequestId: true,
            estimateRequest: { select: { customerId: true } },
          },
        });
        if (estimate) {
          moverId = estimate.moverId;
          customerId = estimate.estimateRequest.customerId;
        }
      } else if (action.entityType === "ESTIMATE_REQUEST") {
        const estimateRequest = await prisma.estimateRequest.findUnique({
          where: { id: action.entityId },
          select: { customerId: true },
        });
        customerId = estimateRequest?.customerId;
      }
      const receivers: { id: string; userType: "MOVER" | "CUSTOMER" }[] = [];
      if (moverId) receivers.push({ id: moverId, userType: "MOVER" });
      if (customerId) receivers.push({ id: customerId, userType: "CUSTOMER" });
      return receivers;
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const {
        moverName = "",
        customerName = "",
        estimateRequestId = "",
        estimateId = "",
      } = (action.metadata as IActionMetadata) || {};
      return {
        title:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`
            : `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`,
        content: "내 견적 관리 > 확정 견적에서 확인할 수 있어요.",
        path:
          userType === "CUSTOMER"
            ? `/estimateRequests/${estimateRequestId}`
            : `/estimate/${estimateId}`,
      };
    },
  },
  ESTIMATE_REJECTED: {
    type: NotificationType.ESTIMATE_STATUS_UPDATED,
    getReceivers: async (action: Action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: { moverId: true },
      });
      return estimate ? [{ id: estimate.moverId, userType: "MOVER" }] : [];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moveType = "", customerName = "" } =
        (action.metadata as IActionMetadata) || {};
      return {
        title: `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">${moveType}</span> 견적이 <span class="text-primary-400 font-bold">반려</span>되었어요.`,
        content: "반려된 견적 상세를 확인하세요.",
        path: `/estimateRequests/${action.entityId}`,
      };
    },
  },
  DESIGNATED_ESTIMATE_REQUEST_SUBMITTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED,
    getReceivers: async (action: Action) => {
      const designatedMovers = await prisma.designatedMover.findMany({
        where: { estimateRequestId: action.entityId, status: "PENDING" },
        select: { moverId: true },
        orderBy: { createdAt: "desc" },
      });
      return designatedMovers.length > 0
        ? [{ id: designatedMovers[0].moverId, userType: "MOVER" }]
        : [];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { customerName = "" } = (action.metadata as IActionMetadata) || {};
      return {
        title: `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">지정 견적</span>이 요청되었어요.`,
        content: "지정 견적이 요청되었습니다.",
        path: `/estimateRequests/${action.entityId}`,
      };
    },
  },
  DESIGNATED_ESTIMATE_REQUEST_REJECTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED,
    getReceivers: async (action: Action) => {
      const estimateRequest = await prisma.estimateRequest.findUnique({
        where: { id: action.entityId },
        select: { customerId: true },
      });
      return estimateRequest
        ? [{ id: estimateRequest.customerId, userType: "CUSTOMER" }]
        : [];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moveType = "" } = (action.metadata as IActionMetadata) || {};
      return {
        title: `<span class="font-bold">${moveType}</span>  <span class="text-primary-400 font-bold">지정 견적 요청</span>이 <span class="text-primary-400 font-bold">반려</span>되었어요.`,
        content: "지정 견적 요청이 반려 되었습니다.",
        path: `/estimateRequests/${action.entityId}`,
      };
    },
  },
  DESIGNATED_ESTIMATE_SUBMITTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_STATUS_UPDATED,
    getReceivers: async (action: Action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: { estimateRequest: { select: { customerId: true } } },
      });
      if (!estimate) return [];
      return [
        { id: estimate.estimateRequest.customerId, userType: "CUSTOMER" },
      ];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moverName = "", moveType = "" } =
        (action.metadata as IActionMetadata) || {};
      return {
        title: `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">${moveType} 지정 견적</span>이 도착했어요.`,
        content: "요청한 지정 견적에 대한 새로운 견적이 도착했습니다.",
        path: `/estimateRequests/${action.entityId}`,
      };
    },
  },

  DESIGNATED_ESTIMATE_ACCEPTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_STATUS_UPDATED,
    getReceivers: async (action: Action) => {
      let moverId: string | undefined;
      let customerId: string | undefined;
      if (action.entityType === "DESIGNATED_ESTIMATE") {
        const estimate = await prisma.estimate.findUnique({
          where: { id: action.entityId },
          select: {
            moverId: true,
            estimateRequestId: true,
            estimateRequest: { select: { customerId: true } },
          },
        });
        if (estimate) {
          moverId = estimate.moverId;
          customerId = estimate.estimateRequest.customerId;
        }
      } else if (action.entityType === "DESIGNATED_ESTIMATE_REQUEST") {
        const estimateRequest = await prisma.estimateRequest.findUnique({
          where: { id: action.entityId },
          select: { customerId: true },
        });
        customerId = estimateRequest?.customerId;
      }
      const receivers: { id: string; userType: "MOVER" | "CUSTOMER" }[] = [];
      if (moverId) receivers.push({ id: moverId, userType: "MOVER" });
      if (customerId) receivers.push({ id: customerId, userType: "CUSTOMER" });
      return receivers;
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const {
        moverName = "",
        customerName = "",
        moveType = "",
        estimateRequestId = "",
        estimateId = "",
      } = (action.metadata as IActionMetadata) || {};
      return {
        title:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">${moveType} 지정 견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`
            : `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">${moveType} 지정 견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`,
        content: "내 견적 관리 > 확정 견적에서 확인할 수 있어요.",
        path:
          userType === "CUSTOMER"
            ? `/estimateRequests/${estimateRequestId}`
            : `/estimate/${estimateId}`,
      };
    },
  },

  DESIGNATED_ESTIMATE_REJECTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_STATUS_UPDATED,
    getReceivers: async (action: Action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: { moverId: true },
      });
      if (!estimate) return [];
      return [{ id: estimate.moverId, userType: "MOVER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { customerName = "", moveType = "" } =
        (action.metadata as IActionMetadata) || {};
      return {
        title: `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">${moveType} 지정 견적</span>이 <span class="text-primary-400 font-bold">반려</span>되었어요.`,
        content: "반려된 견적 상세를 확인하세요.",
        path: `/estimate/${action.entityId}`,
      };
    },
  },

  REVIEW_SUBMITTED: {
    type: NotificationType.REVIEW_EVENT,
    getReceivers: async (action: Action) => {
      const review = await prisma.review.findUnique({
        where: { id: action.entityId },
        select: { moverId: true, estimateRequestId: true },
      });
      if (!review) return [];
      return [{ id: review.moverId, userType: "MOVER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moverId = "" } = (action.metadata as IActionMetadata) || {};
      return {
        title: "리뷰가 등록되었어요.",
        content: "리뷰가 등록되었어요.",
        path: `/moverMypage/${moverId}`,
      };
    },
  },

  FAVORITE_ADDED: {
    type: NotificationType.FAVORITE_EVENT,
    getReceivers: async (action: Action) => {
      const favorite = await prisma.favorite.findUnique({
        where: { id: action.entityId },
        select: { customerId: true },
      });
      if (!favorite) return [];
      return [{ id: favorite.customerId, userType: "CUSTOMER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moverId = "" } = (action.metadata as IActionMetadata) || {};
      return {
        title: "찜이 추가되었어요.",
        content: "찜이 추가되었어요.",
        path: `/moverMypage/${moverId}`,
      };
    },
  },

  FAVORITE_REMOVED: {
    type: NotificationType.FAVORITE_EVENT,
    getReceivers: async (action: Action) => {
      const favorite = await prisma.favorite.findUnique({
        where: { id: action.entityId },
        select: { customerId: true },
      });
      if (!favorite) return [];
      return [{ id: favorite.customerId, userType: "CUSTOMER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moverId = "" } = (action.metadata as IActionMetadata) || {};
      return {
        title: "찜이 제거되었어요.",
        content: "찜이 제거되었어요.",
        path: `/moverMypage/${moverId}`,
      };
    },
  },

  MOVE_DAY_REMINDER_TOMORROW: {
    type: NotificationType.MOVE_DAY_REMINDER,
    getReceivers: async (action: Action) => {
      let moverId: string | undefined;
      let customerId: string | undefined;
      if (action.entityType === "DESIGNATED_ESTIMATE") {
        const estimate = await prisma.estimate.findUnique({
          where: { id: action.entityId },
          select: {
            moverId: true,
            estimateRequestId: true,
            estimateRequest: { select: { customerId: true } },
          },
        });
        if (estimate) {
          moverId = estimate.moverId;
          customerId = estimate.estimateRequest.customerId;
        }
      } else if (action.entityType === "DESIGNATED_ESTIMATE_REQUEST") {
        const estimateRequest = await prisma.estimateRequest.findUnique({
          where: { id: action.entityId },
          select: { customerId: true },
        });
        customerId = estimateRequest?.customerId;
      }
      const receivers: { id: string; userType: "MOVER" | "CUSTOMER" }[] = [];
      if (moverId) receivers.push({ id: moverId, userType: "MOVER" });
      if (customerId) receivers.push({ id: customerId, userType: "CUSTOMER" });
      return receivers;
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moveType = "", estimateId = "" } =
        (action.metadata as IActionMetadata) || {};
      return {
        title: `내일은 <span class="font-bold">${moveType}</span>의 이사 예정일이에요.`,
        content: "이사 준비를 미리 확인해보세요.",
        path: `/estimateRequests/${estimateId}`,
      };
    },
  },

  MOVE_DAY_REMINDER_TODAY: {
    type: NotificationType.MOVE_DAY_REMINDER,
    getReceivers: async (action: Action) => {
      let moverId: string | undefined;
      let customerId: string | undefined;
      if (action.entityType === "DESIGNATED_ESTIMATE") {
        const estimate = await prisma.estimate.findUnique({
          where: { id: action.entityId },
          select: {
            moverId: true,
            estimateRequestId: true,
            estimateRequest: { select: { customerId: true } },
          },
        });
        if (estimate) {
          moverId = estimate.moverId;
          customerId = estimate.estimateRequest.customerId;
        }
      } else if (action.entityType === "DESIGNATED_ESTIMATE_REQUEST") {
        const estimateRequest = await prisma.estimateRequest.findUnique({
          where: { id: action.entityId },
          select: { customerId: true },
        });
        customerId = estimateRequest?.customerId;
      }
      const receivers: { id: string; userType: "MOVER" | "CUSTOMER" }[] = [];
      if (moverId) receivers.push({ id: moverId, userType: "MOVER" });
      if (customerId) receivers.push({ id: customerId, userType: "CUSTOMER" });
      return receivers;
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moveType = "", estimateId = "" } =
        (action.metadata as IActionMetadata) || {};
      return {
        title: `오늘은 <span class="font-bold">${moveType}</span>의 이사 예정일이에요.`,
        content: "이사 준비를 미리 확인해보세요.",
        path: `/estimateRequests/${estimateId}`,
      };
    },
  },

  MOVE_DAY_REVIEW_REQUEST: {
    type: NotificationType.MOVE_DAY_REMINDER,
    getReceivers: async (action: Action) => {
      let customerId: string | undefined;
      if (action.entityType === "DESIGNATED_ESTIMATE") {
        const estimate = await prisma.estimate.findUnique({
          where: { id: action.entityId },
          select: { estimateRequest: { select: { customerId: true } } },
        });
        customerId = estimate?.estimateRequest.customerId;
      }
      return customerId ? [{ id: customerId, userType: "CUSTOMER" }] : [];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moverName = "" } = (action.metadata as IActionMetadata) || {};
      return {
        title: `이사는 어떠셨나요? <span class="text-primary-400 font-bold">${moverName}</span> 기사님에 대한 <span class="font-bold">리뷰</span>를 남겨주세요.`,
        content: "기사님에 대한 리뷰를 남겨주세요.",
        path: `/reviews/writable`, //TODO: 페이지 이동후 해당 모달 열리게  `/reviews/writable/${action.entityId}` 로 변경
      };
    },
  },
};

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
    messageKo: string;
    messageEn: string;
    messageZh: string;
    path: string;
  };
}

const moveTypeMapKo: Record<string, string> = {
  SMALL: "소형이사",
  HOME: "가정이사",
  OFFICE: "사무실이사",
};

const moveTypeMapEn: Record<string, string> = {
  SMALL: "Small Move",
  HOME: "Home Move",
  OFFICE: "Office Move",
};

const moveTypeMapZh: Record<string, string> = {
  SMALL: "小型搬家",
  HOME: "家庭搬家",
  OFFICE: "办公室搬家",
};

export const actionNotificationMap: Record<ActionType, INotificationPayload> = {
  //회원가입 -> 회원, 기사님
  WELCOME: {
    type: NotificationType.WELCOME,
    getReceivers: async (action: Action) => {
      const { userType } = action.metadata as IActionMetadata;
      return [{ id: action.userId, userType }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => ({
      messageKo: '<span class="font-bold">회원가입</span>을 환영합니다!',
      messageEn: '<span class="font-bold">Registration</span> welcome!',
      messageZh: '<span class="font-bold">注册</span>欢迎！',
      path: "/",
    }),
  },

  // 견적요청 등록. -> 기사님
  ESTIMATE_REQUEST_CREATE: {
    type: NotificationType.ESTIMATE_REQUEST_ARRIVED,
    getReceivers: async (action: Action) => {
      // 출발지 정보(region)를 사용하여 필터링
      const estimateRequest = await prisma.estimateRequest.findUnique({
        where: { id: action.entityId },
        select: { fromAddress: true },
      });
      const fromRegion = estimateRequest?.fromAddress?.region;

      const movers = await prisma.user.findMany({
        where: {
          userType: {
            has: "MOVER",
          },
          id: {
            not: action.userId,
          },
          // currentAreas가 있으면 해당 지역만 필터링
          ...(fromRegion && {
            currentAreas: {
              has: fromRegion,
            },
          }),
        },
        select: { id: true },
      });
      return movers.map((mover) => ({ id: mover.id, userType: "MOVER" }));
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => ({
      messageKo: "새 견적 요청이 등록되었습니다.",
      messageEn: "New estimate request has been registered.",
      messageZh: "新估价请求已注册。",
      path: `/estimate/received`,
    }),
  },

  // 가격 책정 -> 회원님
  ESTIMATE_SUBMITTED: {
    type: NotificationType.ESTIMATE_ARRIVED,
    getReceivers: async (action: Action) => {
      return [{ id: action.userId, userType: "CUSTOMER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      const { moverName = "" } = (action.metadata as IActionMetadata) || {};
      return {
        messageKo: `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">견적</span>이 도착했어요.`,
        messageEn: `<span class="font-bold">${moverName}</span> mover's <span class="text-primary-400 font-bold">estimate</span> has arrived.`,
        messageZh: `<span class="font-bold">${moverName}</span> 搬家师傅的 <span class="text-primary-400 font-bold">估价</span>已到达。`,
        path: `/estimateRequest/pending/${action.entityId}`,
      };
    },
  },

  // 견적 확정. -> 회원, 기사님
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
      const { moverName = "", customerName = "" } =
        (action.metadata as IActionMetadata) || {};
      return {
        messageKo:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> 기사님의 견적이 <span class="text-primary-400 font-bold">확정</span>되었어요.`
            : `<span class="font-bold">${customerName}</span> 고객님의 견적이 <span class="text-primary-400 font-bold">확정</span>되었어요.`,
        messageEn:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> mover's estimate has been <span class="text-primary-400 font-bold">confirmed</span>.`
            : `<span class="font-bold">${customerName}</span> customer's estimate has been <span class="text-primary-400 font-bold">confirmed</span>.`,
        messageZh:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> 搬家师傅的估价已 <span class="text-primary-400 font-bold">确定</span>。`
            : `<span class="font-bold">${customerName}</span> 客户的估价已 <span class="text-primary-400 font-bold">确定</span>。`,
        path:
          userType === "CUSTOMER"
            ? `/estimateRequest/pending/${action.entityId}`
            : `/estimate/request/${action.entityId}`,
      };
    },
  },

  // 견적 반려. -> 기사님
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
        messageKo: `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">${moveTypeMapKo[moveType]}</span>에 대한 견적이 <span class="text-primary-400 font-bold">반려</span>되었어요.`,
        messageEn: `<span class="font-bold">${customerName}</span> customer's <span class="text-primary-400 font-bold">${moveTypeMapEn[moveType]}</span> estimate has been <span class="text-primary-400 font-bold">rejected</span>.`,
        messageZh: `<span class="font-bold">${customerName}</span> 客户的 <span class="text-primary-400 font-bold">${moveTypeMapZh[moveType]}</span> 估价已 <span class="text-primary-400 font-bold">拒绝</span>。`,
        path: `/estimate/request/${action.entityId}`,
      };
    },
  },

  // 지정 견적 요청 등록. -> 기사님
  DESIGNATED_ESTIMATE_REQUEST_SUBMITTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_REQUEST_ARRIVED,
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
        messageKo: `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">지정 견적</span>이 요청되었어요.`,
        messageEn: `<span class="font-bold">${customerName}</span> customer's <span class="text-primary-400 font-bold">designated estimate</span> has been requested.`,
        messageZh: `<span class="font-bold">${customerName}</span> 客户的 <span class="text-primary-400 font-bold">指定估价</span>已请求。`,
        path: `/estimate/received`, // TODO: 페이지 이동후 해당 모달 열리게  `/estimate/received?writeModal=true&estimateId=asd` 로 변경
      };
    },
  },

  // 지정 견적 제출. -> 회원
  DESIGNATED_ESTIMATE_SUBMITTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_ARRIVED,
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
        messageKo: `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">${moveTypeMapKo[moveType]}</span>에 대한 <span class="font-bold">지정 견적</span>이 도착했어요.`,
        messageEn: `<span class="font-bold">${moverName}</span> mover's <span class="text-primary-400 font-bold">${moveTypeMapEn[moveType]}</span> <span class="font-bold">designated estimate</span> has arrived.`,
        messageZh: `<span class="font-bold">${moverName}</span> 搬家师傅的 <span class="text-primary-400 font-bold">${moveTypeMapZh[moveType]}</span> <span class="font-bold">指定估价</span>已到达。`,
        path: `/estimateRequest/pending/${action.entityId}`,
      };
    },
  },

  // 지정 견적 요청 반려. -> 회원
  DESIGNATED_ESTIMATE_REQUEST_REJECTED: {
    type: NotificationType.DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED,
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
      const { moveType = "" } = (action.metadata as IActionMetadata) || {};
      return {
        messageKo: `<span class="font-bold">${moveTypeMapKo[moveType]}</span>에 대한 <span class="text-primary-400 font-bold">지정 견적 요청</span>이 <span class="text-primary-400 font-bold">반려</span>되었어요.`,
        messageEn: `<span class="font-bold">${moveTypeMapEn[moveType]}</span> <span class="text-primary-400 font-bold">designated estimate request</span> has been <span class="text-primary-400 font-bold">rejected</span>.`,
        messageZh: `<span class="font-bold">${moveTypeMapZh[moveType]}</span> <span class="text-primary-400 font-bold">指定估价请求</span>已 <span class="text-primary-400 font-bold">拒绝</span>。`,
        path: `/estimateRequest/pending`,
      };
    },
  },

  // 지정 견적 확정. -> 회원, 기사님
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
      } = (action.metadata as IActionMetadata) || {};
      return {
        messageKo:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> 기사님의 <span class="font-bold">${moveTypeMapKo[moveType]}</span>에 대한 <span class="text-primary-400 font-bold">지정 견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`
            : `<span class="font-bold">${customerName}</span> 고객님의 <span class="font-bold">${moveTypeMapKo[moveType]}</span>에 대한 <span class="text-primary-400 font-bold">지정 견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`,
        messageEn:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> mover's <span class="font-bold">${moveTypeMapEn[moveType]}</span> <span class="text-primary-400 font-bold">designated estimate</span> has been <span class="text-primary-400 font-bold">confirmed</span>.`
            : `<span class="font-bold">${customerName}</span> customer's <span class="font-bold">${moveTypeMapEn[moveType]}</span> <span class="text-primary-400 font-bold">designated estimate</span> has been <span class="text-primary-400 font-bold">confirmed</span>.`,
        messageZh:
          userType === "CUSTOMER"
            ? `<span class="font-bold">${moverName}</span> 搬家师傅的 <span class="font-bold">${moveTypeMapZh[moveType]}</span> <span class="text-primary-400 font-bold">指定估价</span>已 <span class="text-primary-400 font-bold">确定</span>。`
            : `<span class="font-bold">${customerName}</span> 客户的 <span class="font-bold">${moveTypeMapZh[moveType]}</span> <span class="text-primary-400 font-bold">指定估价</span>已 <span class="text-primary-400 font-bold">确定</span>。`,
        path:
          userType === "CUSTOMER"
            ? `/estimateRequest/pending/${action.entityId}`
            : `/estimate/request/${action.entityId}`,
      };
    },
  },

  // 지정 견적 반려. -> 기사님
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
        messageKo: `<span class="font-bold">${customerName}</span> 고객님의 <span class="font-bold">${moveTypeMapKo[moveType]}</span>에 대한 <span class="text-primary-400 font-bold">지정 견적</span>이 <span class="text-primary-400 font-bold">반려</span>되었어요.`,
        messageEn: `<span class="font-bold">${customerName}</span> customer's <span class="font-bold">${moveTypeMapEn[moveType]}</span> <span class="text-primary-400 font-bold">designated estimate</span> has been <span class="text-primary-400 font-bold">rejected</span>.`,
        messageZh: `<span class="font-bold">${customerName}</span> 客户 <span class="font-bold">${moveTypeMapZh[moveType]}</span> <span class="text-primary-400 font-bold">指定估价</span>已 <span class="text-primary-400 font-bold">拒绝</span>。`,
        path: `/estimate/request/${action.entityId}`,
      };
    },
  },

  // 리뷰 등록. -> 기사님
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
      return {
        messageKo: "리뷰가 등록되었어요.",
        messageEn: "Review has been registered.",
        messageZh: "评论已注册。",
        path: `/moverMyPage`,
      };
    },
  },

  // 찜하기 -> 기사님
  FAVORITE_ADDED: {
    type: NotificationType.FAVORITE_EVENT,
    getReceivers: async (action: Action) => {
      const favorite = await prisma.favorite.findUnique({
        where: { id: action.entityId },
        select: { moverId: true },
      });
      if (!favorite) return [];
      return [{ id: favorite.moverId, userType: "MOVER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      return {
        messageKo: "찜이 추가되었어요.",
        messageEn: "Favorite has been added.",
        messageZh: "收藏已添加。",
        path: `/moverMyPage`,
      };
    },
  },

  // 찜하기 취소 -> 기사님
  FAVORITE_REMOVED: {
    type: NotificationType.FAVORITE_EVENT,
    getReceivers: async (action: Action) => {
      const favorite = await prisma.favorite.findUnique({
        where: { id: action.entityId },
        select: { moverId: true },
      });
      if (!favorite) return [];
      return [{ id: favorite.moverId, userType: "MOVER" }];
    },
    buildMessage: (action: Action, userType: "CUSTOMER" | "MOVER") => {
      return {
        messageKo: "찜이 제거되었어요.",
        messageEn: "Favorite has been removed.",
        messageZh: "收藏已移除。",
        path: `/moverMyPage`,
      };
    },
  },

  // 이사 전날. -> 회원, 기사님
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
      const { moveType = "" } = (action.metadata as IActionMetadata) || {};
      return {
        messageKo: `내일은 <span class="font-bold">${moveTypeMapKo[moveType]}</span> 예정일이에요.`,
        messageEn: `Tomorrow is the scheduled move date for <span class="font-bold">${moveTypeMapEn[moveType]}</span>.`,
        messageZh: `明天是 <span class="font-bold">${moveTypeMapZh[moveType]}</span> 预定日期。`,
        path:
          userType === "CUSTOMER"
            ? `/estimateRequest/pending/${action.entityId}`
            : `/estimate/request/${action.entityId}`,
      };
    },
  },

  // 이사 당일 -> 회원, 기사님
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
      const { moveType = "" } = (action.metadata as IActionMetadata) || {};
      return {
        messageKo: `오늘은 <span class="font-bold">${moveTypeMapKo[moveType]}</span> 예정일이에요.`,
        messageEn: `Today is the scheduled move date for <span class="font-bold">${moveTypeMapEn[moveType]}</span>.`,
        messageZh: `今天是 <span class="font-bold">${moveTypeMapZh[moveType]}</span> 预定日期。`,
        path:
          userType === "CUSTOMER"
            ? `/estimateRequest/pending/${action.entityId}`
            : `/estimate/request/${action.entityId}`,
      };
    },
  },

  // 리뷰 권유 -> 회원
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
        messageKo: `이사는 어떠셨나요? <span class="text-primary-400 font-bold">${moverName}</span> 기사님에 대한 <span class="font-bold">리뷰</span>를 남겨주세요.`,
        messageEn: `How was your move? Please leave a <span class="font-bold">review</span> for <span class="text-primary-400 font-bold">${moverName}</span> mover.`,
        messageZh: `搬家如何？请为 <span class="text-primary-400 font-bold">${moverName}</span> 搬家师傅留下 <span class="font-bold">评论</span>。`,
        path: `/reviews/writable?modal=write&reviewId=${action.entityId}`,
      };
    },
  },
};

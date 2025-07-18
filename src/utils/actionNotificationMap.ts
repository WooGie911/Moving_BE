import { Action, ActionType, NotificationType } from '@prisma/client';
import prisma from '../db/prisma/prisma';

export interface INotificationPayload {
  type: NotificationType;
  getReceivers: (action: Action) => Promise<{ id: number; role: 'CUSTOMER' | 'MOVER' }[]>;
  buildMessage: (action: Action, role: 'CUSTOMER' | 'MOVER') => {
    title: string;
    content: string;
    actionUrl: string;
  };
}

export const actionNotificationMap: Record<ActionType, INotificationPayload> = {
  QUOTE_CREATE: {
    type: NotificationType.NEW_QUOTE,
    getReceivers: async (action: Action) => {
      // 모든 기사님(userType=MOVER)에게 알림
      const movers = await prisma.user.findMany({
        where: { currentRole: 'MOVER' },
        select: { id: true },
      });
      return movers.map((mover) => ({ id: mover.id, role: 'MOVER' as const }));
    },
    buildMessage: (action: Action) => ({
      title: '새 견적 요청이 등록되었습니다.',
      content: '새로운 견적 요청이 등록되었습니다.',
      actionUrl: `/quotes/${action.entityId}`,
    }),
  },
  QUOTE_REJECTED: {
    type: NotificationType.ESTIMATE_REJECTED,
    getReceivers: async (action:Action) => {
      // 견적 반려 시 고객에게 알림
      const quote = await prisma.quote.findUnique({
        where: { id: action.entityId },
        select: { userId: true },
      });
      return quote ? [{ id: quote.userId, role: 'CUSTOMER' }] : [];
    },
    buildMessage: (action) => ({
      title: '견적이 반려되었습니다.',
      content: '견적 요청이 반려되었습니다. 상세 내용을 확인하세요.',
      actionUrl: `/quotes/${action.entityId}`,
    }),
  },
  ESTIMATE_SUBMITTED: {
    type: NotificationType.ESTIMATE_SUBMITTED,
    getReceivers: async (action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: { quote: { select: { userId: true } } },
      });
      return estimate ? [{ id: estimate.quote.userId, role: 'CUSTOMER' }] : [];
    },
    buildMessage: (action) => {
      const { moverName, movingType, estimateId } = action.metadata as any;
      return {
        title: `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">${movingType}</span> 견적이 도착했어요.`,
        content: '대기중인 견적에서 확인할 수 있어요.',
        actionUrl: `/estimate/${estimateId}`,
      };
    },
  },
  ESTIMATE_ACCEPTED: {
    type: NotificationType.ESTIMATE_CONFIRMED,
    getReceivers: async (action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: {
          moverId: true,
          quote: { select: { userId: true } },
        },
      });
      if (!estimate) return [];
      return [
        { id: estimate.moverId, role: 'MOVER' },
        { id: estimate.quote.userId, role: 'CUSTOMER' },
      ];
    },
    buildMessage: (action, role) => {
      const { quoteId, moverName, customerName } = action.metadata as any;
      return {
        title:
          role === 'CUSTOMER'
            ? `<span class="font-bold">${moverName}</span> 기사님의 <span class="text-primary-400 font-bold">견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`
            : `<span class="font-bold">${customerName}</span> 고객님의 <span class="text-primary-400 font-bold">견적</span>이 <span class="text-primary-400 font-bold">확정</span>되었어요.`,
        content: '내 견적 관리 > 확정 견적에서 확인할 수 있어요.',
        actionUrl:
          role === 'CUSTOMER' ? `/quotes/${quoteId}` : `/estimate/${quoteId}`,
      };
    },
  },
  ESTIMATE_REJECTED: {
    type: NotificationType.ESTIMATE_REJECTED,
    getReceivers: async (action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: { moverId: true },
      });
      return estimate ? [{ id: estimate.moverId, role: 'MOVER' }] : [];
    },
    buildMessage: (action) => {
      const { customerName, estimateId } = action.metadata as any;
      return {
        title: `<span class="font-bold">${customerName}</span> 고객님의 견적이 <span class="text-primary-400 font-bold">반려</span>되었어요.`,
        content: '반려된 견적 상세를 확인하세요.',
        actionUrl: `/estimate/${estimateId}`,
      };
    },
  },
  DESIGNATED_QUOTE_REQUESTED: {
    type: NotificationType.DESIGNATED_QUOTE_REQUESTED,
    getReceivers: async (action) => {
      const request = await prisma.designatedEstimateRequest.findUnique({
        where: { id: action.entityId },
        select: { moverId: true },
      });
      return request ? [{ id: request.moverId, role: 'MOVER' }] : [];
    },
    buildMessage: (action) => {
      const { customerName, quoteId } = action.metadata as any;
      return {
        title: `<span class="font-bold">${customerName}</span> 고객님의 <span class="font-bold">지정 견적</span>이 요청되었어요.`,
        content: '받은 요청 페이지에서 확인해보세요.',
        actionUrl: `/designated-quote/${quoteId}`,
      };
    },
  },
  DESIGNATED_ESTIMATE_SUBMITTED: {
    type: NotificationType.ESTIMATE_SUBMITTED,
    getReceivers: async (action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: { quote: { select: { userId: true } } },
      });
      return estimate ? [{ id: estimate.quote.userId, role: 'CUSTOMER' }] : [];
    },
    buildMessage: (action) => {
      const { moverName, movingType, estimateId } = action.metadata as any;
      return {
        title: `<span class="font-bold">지정<span> 요청한 <span class="text-primary-400 font-bold">${movingType}</span> 견적이 도착했어요.`,
        content: '대기중인 지정 견적에서 확인할 수 있어요.',
        actionUrl: `/estimate/${estimateId}`,
      };
    },
  },
  MOVING_COMPLETED: {
    type: NotificationType.REVIEW_REQUEST,
    getReceivers: async (action) => {
      const quote = await prisma.quote.findUnique({
        where: { id: action.entityId },
        select: { userId: true },
      });
      return quote ? [{ id: quote.userId, role: 'CUSTOMER' }] : [];
    },
    buildMessage: (action) => {
      const { movingType, quoteId } = action.metadata as any;
      return {
        title: `어제 <span class="text-primary-400 font-bold">${movingType}</span> 이사는 어떠셨나요? 기사님에 대한 <span class="text-primary-400 font-bold">리뷰</span>를 남겨주세요.`,
        content: '기사님에 대한 리뷰를 남겨주세요.',
        actionUrl: `/quotes/${quoteId}/review`,
      };
    },
  },
  REVIEW_SUBMITTED: {
    type: NotificationType.REVIEW_REQUEST,
    getReceivers: async (action) => {
      const review = await prisma.review.findUnique({
        where: { id: action.entityId },
        select: { moverId: true },
      });
      return review ? [{ id: review.moverId, role: 'MOVER' }] : [];
    },
    buildMessage: () => ({
      title: '<span class="text-primary-400 font-bold">새 리뷰</span>가 등록되었어요.',
      content: '고객이 리뷰를 남겼어요. 지금 확인해보세요!',
      actionUrl: `/mover/reviews`,
    }),
  },
  MOVING_DAY_TOMORROW: {
    type: NotificationType.MOVING_DAY,
    getReceivers: async (action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: {
          moverId: true,
          quote: { select: { userId: true } },
        },
      });
      if (!estimate) return [];
      return [
        { id: estimate.moverId, role: 'MOVER' },
        { id: estimate.quote.userId, role: 'CUSTOMER' },
      ];
    },
    buildMessage: (action: Action) => {
      const { quoteId, movingType } = action.metadata as any;
      return {
        title: `내일은 <span class="text-primary-400 font-bold">${movingType}</span> 이사 예정일이에요.`,
        content: '이사 준비를 미리 확인해보세요.',
        actionUrl: `/quotes/${quoteId}`,
      };
    },
  },
  MOVING_DAY_TODAY: {
    type: NotificationType.MOVING_DAY,
    getReceivers: async (action: Action) => {
      const estimate = await prisma.estimate.findUnique({
        where: { id: action.entityId },
        select: {
          moverId: true,
          quote: { select: { userId: true } },
        },
      });
      if (!estimate) return [];
      return [
        { id: estimate.moverId, role: 'MOVER' },
        { id: estimate.quote.userId, role: 'CUSTOMER' },
      ];
    },
    buildMessage: (action: Action) => {
      const { quoteId, movingType } = action.metadata as any;
      return {
        title: `오늘은 <span class="text-primary-400 font-bold">${movingType}</span> 이사 예정일이에요.`,
        content: '이사가 안전하게 진행되길 바래요.',
        actionUrl: `/quotes/${quoteId}`,
      };
    },
  },
};

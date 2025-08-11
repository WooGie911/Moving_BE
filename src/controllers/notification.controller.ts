import { Request, Response, NextFunction } from "express";
import notificationService from "../services/notification.service";
import { UserType } from "@prisma/client";

const notificationController = {
  // 알림 목록 조회
  getNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "해당 유저를 찾을수 없습니다." });
      }
      const userType = req.query.userType as UserType;
      const limit = Number(req.query.limit) || 5;
      const offset = Number(req.query.offset) || 0;
      const lang = (req.query.lang as string) || 'ko'; // 기본값은 한국어
      
      const notifications = await notificationService.getNotifications(
        userType,
        userId as string,
        limit,
        offset,
        lang
      );

      res.json({
        success: true,
        message: "알림 목록입니다.",
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },
  // 알림 읽음 처리
  readNotification: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationId = req.params.notificationId;
      if (!notificationId) {
        return res
          .status(400)
          .json({ success: false, message: "해당 알림을 찾을수 없습니다." });
      }
      const notification = await notificationService.readNotification(
        notificationId as string
      );
      res.json({
        success: true,
        message: "알림이 읽음 처리되었습니다.",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },
  // 전체 알림 읽음 처리
  readAllNotifications: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "해당 유저를 찾을수 없습니다." });
      }
      const count = await notificationService.readAllNotifications(
        userId as string
      );
      res.json({
        success: true,
        message: "모든 알림이 읽음 처리되었습니다.",
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default notificationController;

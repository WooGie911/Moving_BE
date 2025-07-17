import { Request, Response, NextFunction } from "express";
import notificationService from "../services/notification.service";

const notificationController = {
  // 알림 목록 조회
  getNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(req.user?.userId);
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "해당 유저를 찾을수 없습니다." });
      }
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;
      const notifications = await notificationService.getNotifications(
        userId,
        limit,
        offset
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
};

export default notificationController;

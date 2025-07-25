import { Router, Request, Response } from "express";
import expirationService from "../services/expiration.service";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();

/**
 * @swagger
 * /expiration/process:
 *   post:
 *     summary: 수동으로 만료된 견적 요청 처리
 *     description: 테스트 목적으로 만료된 견적 요청을 수동으로 처리합니다.
 *     tags: [Expiration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 처리 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     processedRequests:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post(
  "/process",
  verifyAccessToken,
  async (req: Request, res: Response) => {
    try {
      const result = await expirationService.manualProcessExpiredRequests();

      res.status(200).json({
        success: true,
        message: "만료된 견적 요청 처리 완료",
        data: result,
      });
    } catch (error) {
      console.error("수동 만료 처리 실패:", error);
      res.status(500).json({
        success: false,
        message: "만료 처리 중 오류가 발생했습니다.",
      });
    }
  }
);

export default router;

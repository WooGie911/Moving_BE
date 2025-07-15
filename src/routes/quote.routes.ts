import { Router } from "express";
import QuoteController from "../controllers/quote.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();
const quoteController = new QuoteController();

// 견적 요청 생성 (POST)
router.post("/", verifyAccessToken, quoteController.createQuote);

// 활성 견적 요청 조회 (GET)
router.get("/active", verifyAccessToken, quoteController.getActiveQuote);

// 견적 요청 수정 (PATCH)
router.patch("/active/:quoteId", verifyAccessToken, quoteController.updateQuote);

// 활성 견적 요청 취소 (DELETE)
router.delete("/active", verifyAccessToken, quoteController.cancelActiveQuote);

export default router;

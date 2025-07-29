import { Router } from "express";
import favoriteController from "../controllers/favorite.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FavoriteRequest:
 *       type: object
 *       properties:
 *         moverId:
 *           type: integer
 *           description: 기사님 ID
 *           required: true
 *       required:
 *         - moverId
 *
 *     FavoriteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         data:
 *           type: object
 *           properties:
 *             isFavorited:
 *               type: boolean
 *               description: 찜하기 상태
 *             favoriteCount:
 *               type: integer
 *               description: 찜하기 개수
 *
 *     FavoriteErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         message:
 *           type: string
 *           description: 에러 메시지
 */

/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: 찜하기 추가
 *     description: 기사님을 찜하기 목록에 추가합니다.
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoriteRequest'
 *           example:
 *             moverId: 1
 *     responses:
 *       201:
 *         description: 찜하기 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteResponse'
 *             example:
 *               success: true
 *               message: "찜하기가 추가되었습니다."
 *               data:
 *                 isFavorited: true
 *                 favoriteCount: 5
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "잘못된 요청입니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다"
 */
router.post("/", verifyAccessToken, favoriteController.addFavorite);

/**
 * @swagger
 * /favorites/{moverId}/status:
 *   get:
 *     summary: 찜하기 상태 확인
 *     description: 특정 기사님의 찜하기 상태를 확인합니다.
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: string
 *         required: true
 *         description: 기사님 ID
 *     responses:
 *       200:
 *         description: 찜하기 상태 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteResponse'
 *             example:
 *               success: true
 *               message: "찜하기 상태를 성공적으로 조회했습니다."
 *               data:
 *                 isFavorited: true
 *                 favoriteCount: 5
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "잘못된 요청입니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다"
 */
router.get("/:moverId/status", verifyAccessToken, favoriteController.getFavoriteStatus);

/**
 * @swagger
 * /favorites/{moverId}:
 *   delete:
 *     summary: 찜하기 제거
 *     description: 기사님을 찜하기 목록에서 제거합니다.
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 기사님 ID
 *     responses:
 *       200:
 *         description: 찜하기 제거 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteResponse'
 *             example:
 *               success: true
 *               message: "찜하기가 제거되었습니다."
 *               data:
 *                 isFavorited: false
 *                 favoriteCount: 4
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "잘못된 요청입니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "인증이 필요합니다"
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "권한이 없습니다"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "서버 내부 오류가 발생했습니다"
 */
router.delete("/:moverId", verifyAccessToken, favoriteController.removeFavorite);

export default router;

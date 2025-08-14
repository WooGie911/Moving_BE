import { Router } from "express";
import favoriteController from "../controllers/favorite.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { defaultTranslationMiddleware } from "../middlewares/translationMiddleware";
// 캐싱은 찜하기 전 영역에서 완전히 비활성화 (실시간 반영)

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
 *     FavoriteMoversResponse:
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
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 기사님 ID
 *                   name:
 *                     type: string
 *                     description: 기사님 이름
 *                   profileImage:
 *                     type: string
 *                     description: 프로필 이미지
 *                   rating:
 *                     type: number
 *                     description: 평점
 *                   reviewCount:
 *                     type: number
 *                     description: 리뷰 수
 *                   regions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 서비스 지역
 *                   services:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 제공 서비스
 *                   introduction:
 *                     type: string
 *                     description: 소개
 *                   experience:
 *                     type: number
 *                     description: 경력
 *                   vehicleType:
 *                     type: string
 *                     description: 차량 타입
 *                   vehicleSize:
 *                     type: string
 *                     description: 차량 크기
 *                   isAvailable:
 *                     type: boolean
 *                     description: 예약 가능 여부
 *                   isFavorited:
 *                     type: boolean
 *                     description: 찜하기 상태
 *             nextCursor:
 *               type: string
 *               description: 다음 페이지 커서
 *             hasNext:
 *               type: boolean
 *               description: 다음 페이지 존재 여부
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
 *             moverId: "clx123..."
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
 * /favorites/movers:
 *   get:
 *     summary: 찜한 기사님 목록 조회
 *     description: 사용자가 찜한 기사님 목록을 페이지네이션으로 조회합니다.
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 3
 *         description: 한 번에 조회할 항목 수 (1-50)
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 다음 페이지 조회를 위한 커서
 *     responses:
 *       200:
 *         description: 찜한 기사님 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteMoversResponse'
 *             example:
 *               success: true
 *               message: "찜한 기사님 목록을 성공적으로 조회했습니다."
 *               data:
 *                 items:
 *                   - id: "1"
 *                     name: "김기사"
 *                     profileImage: "https://example.com/image.jpg"
 *                     rating: 4.5
 *                     reviewCount: 10
 *                     regions: ["서울", "경기"]
 *                     services: ["이사", "청소"]
 *                     introduction: "안전하고 신속한 이사 서비스"
 *                     experience: 5
 *                     vehicleType: "1톤"
 *                     vehicleSize: "소형"
 *                     isAvailable: true
 *                     isFavorited: true
 *                 nextCursor: "next_cursor_id"
 *                 hasNext: true
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteErrorResponse'
 *             example:
 *               success: false
 *               message: "limit은 1-50 사이의 값이어야 합니다"
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
router.get("/movers", verifyAccessToken, defaultTranslationMiddleware, favoriteController.getFavoriteMovers);

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
router.get("/:moverId/status", verifyAccessToken, defaultTranslationMiddleware, favoriteController.getFavoriteStatus);

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

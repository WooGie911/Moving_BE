import { Router } from "express";
import favoriteController from "../controllers/favorite.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";

const router = Router();

/**
 * POST /favorites
 * @summary 찜하기 추가
 * @tags Favorites
 * @security BearerAuth
 * @param {object} request.body.required - 찜하기 요청 정보
 * @param {number} request.body.moverId.required - 기사님 ID
 * @return {object} 201 - 찜하기 성공
 * @return {object} 400 - 잘못된 요청
 * @return {object} 401 - 인증 실패
 * @return {object} 403 - 권한 없음
 * @return {object} 500 - 서버 오류
 * @example request - 찜하기 추가 요청
 * {
 *   "moverId": 1
 * }
 * @example response - 201 - 찜하기 성공
 * {
 *   "success": true,
 *   "message": "찜하기가 추가되었습니다.",
 *   "data": {
 *     "isFavorited": true,
 *     "favoriteCount": 5
 *   }
 * }
 */
router.post("/", verifyAccessToken, favoriteController.addFavorite);

/**
 * DELETE /favorites/:moverId
 * @summary 찜하기 제거
 * @tags Favorites
 * @security BearerAuth
 * @param {number} moverId.path.required - 기사님 ID
 * @return {object} 200 - 찜하기 제거 성공
 * @return {object} 400 - 잘못된 요청
 * @return {object} 401 - 인증 실패
 * @return {object} 403 - 권한 없음
 * @return {object} 500 - 서버 오류
 * @example response - 200 - 찜하기 제거 성공
 * {
 *   "success": true,
 *   "message": "찜하기가 제거되었습니다.",
 *   "data": {
 *     "isFavorited": false,
 *     "favoriteCount": 4
 *   }
 * }
 */
router.delete("/:moverId", verifyAccessToken, favoriteController.removeFavorite);

export default router; 
import { Router } from "express";
import {
  getMoverListController,
  getBookmarkedMoversController,
} from "../controllers/mover.controller";

const moverRouter = Router();

/**
 * GET /movers
 * @summary 기사님 리스트 조회
 * @description 기사님 목록을 조회
 * @param {string} region.query - 지역 필터
 * @param {number} serviceTypeId.query - 서비스 종류 ID
 * @param {string} search.query - 닉네임 검색 키워드
 * @param {string} sort.query - 정렬 기준
 * @param {number} cursor.query - 무한스크롤 커서
 * @param {number} take.query - 조회할 개수
 * @returns {object} 200 - 기사님 목록 조회 성공
 * @returns {object} 404 - 데이터 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "userId": 4,
 *       "nickname": "믿을만한김기사",
 *       "profileImage": "https://s3.amazonaws.com/profiles/profile1.jpg",
 *       "experience": 5,
 *       "introduction": "5년 경력의 꼼꼼한 이사 전문가입니다",
 *       "description": "안전하고 신속한 이사를 약속드립니다.",
 *       "completedCount": 136,
 *       "avgRating": 5.0,
 *       "reviewCount": 128,
 *       "favoriteCount": 45,
 *       "lastActivityAt": "2025-07-10T00:33:16.456Z",
 *       "user": {
 *         "id": 4,
 *         "name": "김민수",
 *         "email": "mover1@example.com"
 *       },
 *       "serviceRegions": [
 *         { "id": 1, "profileId": 1, "region": "SEOUL" }
 *       ],
 *       "serviceTypes": [
 *         {
 *           "id": 1,
 *           "profileId": 1,
 *           "serviceId": 1,
 *           "service": {
 *             "id": 1,
 *             "name": "소형이사",
 *             "description": "원룸, 투룸 등 소규모 이사",
 *             "isActive": true,
 *             "iconUrl": "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * @example response - 404 - 데이터 없음
 * {
 *   "status": 404,
 *   "message": "조회된 기사님이 없습니다."
 * }
 */
moverRouter.get("/", getMoverListController);

/**
 * GET /movers/bookmarked
 * @summary 찜한 기사님 조회
 * @description 사용자가 찜한 기사님을 최신순 3명까지 조회
 * @returns {object} 200 - 찜한 기사님 목록 조회 성공
 * @returns {object} 401 - 인증 실패
 * @returns {object} 404 - 데이터 없음
 * @example response - 200 - 성공 예시
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "userId": 4,
 *       "nickname": "믿을만한김기사",
 *       "profileImage": "https://s3.amazonaws.com/profiles/profile1.jpg",
 *       "experience": 5,
 *       "introduction": "5년 경력의 꼼꼼한 이사 전문가입니다",
 *       "description": "안전하고 신속한 이사를 약속드립니다.",
 *       "completedCount": 136,
 *       "avgRating": 5.0,
 *       "reviewCount": 128,
 *       "favoriteCount": 45,
 *       "lastActivityAt": "2025-07-10T00:33:16.456Z",
 *       "user": {
 *         "id": 4,
 *         "name": "김민수",
 *         "email": "mover1@example.com"
 *       },
 *       "serviceRegions": [
 *         { "id": 1, "profileId": 1, "region": "SEOUL" }
 *       ],
 *       "serviceTypes": [
 *         {
 *           "id": 1,
 *           "profileId": 1,
 *           "serviceId": 1,
 *           "service": {
 *             "id": 1,
 *             "name": "소형이사",
 *             "description": "원룸, 투룸 등 소규모 이사",
 *             "isActive": true,
 *             "iconUrl": "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * @example response - 401 - 인증 실패
 * {
 *   "status": 401,
 *   "message": "인증이 필요합니다."
 * }
 * @example response - 404 - 데이터 없음
 * {
 *   "status": 404,
 *   "message": "찜한 기사님이 없습니다."
 * }
 */
moverRouter.get("/bookmarked", getBookmarkedMoversController);

export default moverRouter;

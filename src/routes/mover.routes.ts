import { Router } from "express";
import {
  getMoverListController,
  getBookmarkedMoversController,
} from "../controllers/mover.controller";

const moverRouter = Router();

/**
 * 기사님 정보
 * @typedef {object} MoverInfo
 * @property {number} id - 기사님 프로필 ID
 * @property {number} userId - 사용자 ID
 * @property {string} nickname - 기사님 닉네임
 * @property {string} profileImage - 프로필 이미지 URL
 * @property {number} experience - 경력 (년)
 * @property {string} introduction - 소개글
 * @property {string} description - 상세 설명
 * @property {number} completedCount - 완료된 이사 건수
 * @property {number} avgRating - 평균 평점
 * @property {number} reviewCount - 리뷰 개수
 * @property {number} favoriteCount - 찜한 사용자 수
 * @property {string} lastActivityAt - 마지막 활동 시간
 * @property {object} user - 사용자 정보
 * @property {number} user.id - 사용자 ID
 * @property {string} user.name - 사용자 이름
 * @property {string} user.email - 사용자 이메일
 * @property {array} serviceRegions - 서비스 지역 목록
 * @property {array} serviceTypes - 서비스 종류 목록
 */

/**
 * 기사님 리스트 응답
 * @typedef {object} MoverListResponse
 * @property {boolean} success - 성공 여부
 * @property {array<MoverInfo>} data - 기사님 목록
 */

/**
 * 기사님 리스트 필터
 * @typedef {object} MoverListFilter
 * @property {string} region - 지역 필터 (SEOUL, BUSAN, DAEGU, INCHEON, GWANGJU, DAEJEON, ULSAN, SEJONG, GYEONGGI, CHUNGBUK, CHUNGNAM, JEONBUK, JEONNAM, GYEONGBUK, GYEONGNAM, GANGWON, JEJU)
 * @property {number} serviceTypeId - 서비스 종류 ID (1: 소형이사, 2: 가정이사, 3: 사무실이사)
 * @property {string} search - 닉네임 검색 키워드
 * @property {string} sort - 정렬 기준 (review: 리뷰순, rating: 평점순, career: 경력순, confirmed: 확정순)
 * @property {number} cursor - 무한스크롤 커서 (마지막 기사님 ID)
 * @property {number} take - 조회할 개수 (기본값: 20, 최대: 50)
 */

/**
 * 에러 응답
 * @typedef {object} ErrorResponse
 * @property {boolean} success - 성공 여부 (false)
 * @property {object} error - 에러 정보
 * @property {string} error.message - 에러 메시지
 * @property {number} error.status - HTTP 상태 코드
 */

// 기사님 리스트 조회 엔드포인트
/**
 * GET /movers
 * @summary 기사님 리스트 조회
 * @description 필터링, 정렬, 검색 기능을 지원하는 기사님 목록을 조회합니다. 무한스크롤을 지원하며 최대 20개씩 반환합니다.
 * @tags Movers
 * @param {string} region.query - 지역 필터 (예: SEOUL, BUSAN, GYEONGGI)
 * @param {number} serviceTypeId.query - 서비스 종류 ID (1: 소형이사, 2: 가정이사, 3: 사무실이사)
 * @param {string} search.query - 닉네임 검색 키워드
 * @param {string} sort.query - 정렬 기준 (review: 리뷰순, rating: 평점순, career: 경력순, confirmed: 확정순)
 * @param {number} cursor.query - 무한스크롤 커서 (마지막 기사님 ID)
 * @param {number} take.query - 조회할 개수 (기본값: 20, 최대: 50)
 * @return {MoverListResponse} 200 - 기사님 목록 조회 성공
 * @return {ErrorResponse} 400 - 잘못된 쿼리 파라미터
 * @return {ErrorResponse} 500 - 서버 내부 오류
 * @example request - 기본 조회
 * GET /movers
 * @example request - 지역 필터 조회
 * GET /movers?region=SEOUL
 * @example request - 서비스 필터 조회
 * GET /movers?serviceTypeId=1
 * @example request - 닉네임 검색
 * GET /movers?search=김
 * @example request - 정렬 (경력순)
 * GET /movers?sort=career
 * @example request - 무한스크롤
 * GET /movers?take=2&cursor=4
 * @example response - 200 - 성공 응답 예시
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
 *         {
 *           "id": 1,
 *           "profileId": 1,
 *           "region": "SEOUL"
 *         }
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
 */
moverRouter.get("/", getMoverListController);

// 찜한 기사님 조회 엔드포인트
/**
 * GET /movers/bookmarked
 * @summary 찜한 기사님 조회
 * @description 현재 사용자가 찜한 기사님 목록을 조회합니다. 최근 활동 순으로 정렬됩니다.
 * @tags Movers
 * @return {MoverListResponse} 200 - 찜한 기사님 목록 조회 성공
 * @return {ErrorResponse} 500 - 서버 내부 오류
 * @example request - 찜한 기사님 조회
 * GET /movers/bookmarked
 * @example response - 200 - 성공 응답 예시
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
 *         {
 *           "id": 1,
 *           "profileId": 1,
 *           "region": "SEOUL"
 *         }
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
 */
moverRouter.get("/bookmarked", getBookmarkedMoversController);

export default moverRouter;

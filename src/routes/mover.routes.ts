import { Router } from "express";
import * as moverController from "../controllers/mover.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import { optionalAuth } from "../middlewares/optionalAuth";
import { defaultTranslationMiddleware } from "../middlewares/translationMiddleware";

const moverRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MoverInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 기사님 프로필 ID
 *         userId:
 *           type: integer
 *           description: 사용자 ID
 *         nickname:
 *           type: string
 *           description: 닉네임
 *         profileImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         experience:
 *           type: integer
 *           description: 경력 (년)
 *         introduction:
 *           type: string
 *           description: 한줄 소개
 *         description:
 *           type: string
 *           description: 상세 설명
 *         completedCount:
 *           type: integer
 *           description: 완료된 이사 건수
 *         avgRating:
 *           type: number
 *           description: 평균 평점
 *         reviewCount:
 *           type: integer
 *           description: 리뷰 개수
 *         favoriteCount:
 *           type: integer
 *           description: 찜 개수
 *         lastActivityAt:
 *           type: string
 *           description: 마지막 활동 시간
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: 사용자 ID
 *             name:
 *               type: string
 *               description: 사용자 이름
 *             email:
 *               type: string
 *               description: 이메일
 *         serviceRegions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 서비스 지역 ID
 *               profileId:
 *                 type: integer
 *                 description: 프로필 ID
 *               region:
 *                 type: string
 *                 description: 지역명
 *         serviceTypes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 서비스 타입 ID
 *               profileId:
 *                 type: integer
 *                 description: 프로필 ID
 *               serviceId:
 *                 type: integer
 *                 description: 서비스 ID
 *               service:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: 서비스 ID
 *                   name:
 *                     type: string
 *                     description: 서비스명
 *                   description:
 *                     type: string
 *                     description: 서비스 설명
 *                   isActive:
 *                     type: boolean
 *                     description: 활성화 여부
 *                   iconUrl:
 *                     type: string
 *                     description: 아이콘 URL
 *
 *     MoverListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MoverInfo'
 *           description: 기사님 목록
 *
 *     MoverErrorResponse:
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
 * /movers:
 *   get:
 *     summary: 기사님 리스트 조회
 *     description: 기사님 목록을 조회합니다.
 *     tags: [Mover]
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: 지역 필터
 *       - in: query
 *         name: serviceTypeId
 *         schema:
 *           type: integer
 *         description: 서비스 종류 ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 닉네임 검색 키워드
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: 정렬 기준
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: 무한스크롤 커서
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *         description: 조회할 개수
 *     responses:
 *       200:
 *         description: 기사님 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverListResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   userId: 4
 *                   nickname: "믿을만한김기사"
 *                   profileImage: "https://s3.amazonaws.com/profiles/profile1.jpg"
 *                   experience: 5
 *                   introduction: "5년 경력의 꼼꼼한 이사 전문가입니다"
 *                   description: "안전하고 신속한 이사를 약속드립니다."
 *                   completedCount: 136
 *                   avgRating: 5.0
 *                   reviewCount: 128
 *                   favoriteCount: 45
 *                   lastActivityAt: "2025-07-10T00:33:16.456Z"
 *                   user:
 *                     id: 4
 *                     name: "김민수"
 *                     email: "mover1@example.com"
 *                   serviceRegions:
 *                     - id: 1
 *                       profileId: 1
 *                       region: "SEOUL"
 *                   serviceTypes:
 *                     - id: 1
 *                       profileId: 1
 *                       serviceId: 1
 *                       service:
 *                         id: 1
 *                         name: "소형이사"
 *                         description: "원룸, 투룸 등 소규모 이사"
 *                         isActive: true
 *                         iconUrl: "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *       404:
 *         description: 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MoverErrorResponse'
 *             example:
 *               success: false
 *               message: "기사님을 찾을 수 없습니다"
 */
moverRouter.get(
  "/",
  defaultTranslationMiddleware,
  moverController.getMoverListController
);

/**
 * @swagger
 * /movers/favorite:
 *   get:
 *     summary: 찜한 기사님 조회
 *     description: 사용자가 찜한 기사님을 최신순 3명까지 조회합니다.
 *     tags: [Mover]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 찜한 기사님 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 기사님 ID
 *                       userId:
 *                         type: integer
 *                         description: 사용자 ID
 *                       nickname:
 *                         type: string
 *                         description: 닉네임
 *                       profileImage:
 *                         type: string
 *                         description: 프로필 이미지 URL
 *                       experience:
 *                         type: integer
 *                         description: 경력 연차
 *                       introduction:
 *                         type: string
 *                         description: 소개
 *                       description:
 *                         type: string
 *                         description: 상세 설명
 *                       completedCount:
 *                         type: integer
 *                         description: 완료된 이사 건수
 *                       avgRating:
 *                         type: number
 *                         description: 평균 평점
 *                       reviewCount:
 *                         type: integer
 *                         description: 리뷰 개수
 *                       favoriteCount:
 *                         type: integer
 *                         description: 찜 개수
 *                       lastActivityAt:
 *                         type: string
 *                         description: 마지막 활동 시간
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: 사용자 ID
 *                           name:
 *                             type: string
 *                             description: 이름
 *                           email:
 *                             type: string
 *                             description: 이메일
 *                       serviceRegions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               description: 서비스 지역 ID
 *                             profileId:
 *                               type: integer
 *                               description: 프로필 ID
 *                             region:
 *                               type: string
 *                               description: 지역
 *                       serviceTypes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               description: 서비스 타입 ID
 *                             profileId:
 *                               type: integer
 *                               description: 프로필 ID
 *                             serviceId:
 *                               type: integer
 *                               description: 서비스 ID
 *                             service:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   description: 서비스 ID
 *                                 name:
 *                                   type: string
 *                                   description: 서비스명
 *                                 description:
 *                                   type: string
 *                                   description: 서비스 설명
 *                                 isActive:
 *                                   type: boolean
 *                                   description: 활성화 여부
 *                                 iconUrl:
 *                                   type: string
 *                                   description: 아이콘 URL
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   userId: 4
 *                   nickname: "믿을만한김기사"
 *                   profileImage: "https://s3.amazonaws.com/profiles/profile1.jpg"
 *                   experience: 5
 *                   introduction: "5년 경력의 꼼꼼한 이사 전문가입니다"
 *                   description: "안전하고 신속한 이사를 약속드립니다."
 *                   completedCount: 136
 *                   avgRating: 5.0
 *                   reviewCount: 128
 *                   favoriteCount: 45
 *                   lastActivityAt: "2025-07-10T00:33:16.456Z"
 *                   user:
 *                     id: 4
 *                     name: "김민수"
 *                     email: "mover1@example.com"
 *                   serviceRegions:
 *                     - id: 1
 *                       profileId: 1
 *                       region: "SEOUL"
 *                   serviceTypes:
 *                     - id: 1
 *                       profileId: 1
 *                       serviceId: 1
 *                       service:
 *                         id: 1
 *                         name: "소형이사"
 *                         description: "원룸, 투룸 등 소규모 이사"
 *                         isActive: true
 *                         iconUrl: "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: 상태 코드
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               status: 401
 *               message: "인증이 필요합니다."
 *       404:
 *         description: 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: 상태 코드
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               status: 404
 *               message: "찜한 기사님이 없습니다."
 */
moverRouter.get(
  "/favorite",
  verifyAccessToken,
  defaultTranslationMiddleware,
  moverController.getFavoriteMoversController
);

/**
 * @swagger
 * /movers/{moverId}:
 *   get:
 *     summary: 기사님 상세 조회
 *     description: 기사님의 상세 정보를 조회합니다.
 *     tags: [Mover]
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: string
 *         required: true
 *         description: 기사님 ID
 *     responses:
 *       200:
 *         description: 기사님 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 기사님 ID
 *                     userId:
 *                       type: integer
 *                       description: 사용자 ID
 *                     nickname:
 *                       type: string
 *                       description: 닉네임
 *                     profileImage:
 *                       type: string
 *                       description: 프로필 이미지 URL
 *                     experience:
 *                       type: integer
 *                       description: 경력 연차
 *                     introduction:
 *                       type: string
 *                       description: 소개
 *                     description:
 *                       type: string
 *                       description: 상세 설명
 *                     completedCount:
 *                       type: integer
 *                       description: 완료된 이사 건수
 *                     avgRating:
 *                       type: number
 *                       description: 평균 평점
 *                     reviewCount:
 *                       type: integer
 *                       description: 리뷰 개수
 *                     favoriteCount:
 *                       type: integer
 *                       description: 찜 개수
 *                     lastActivityAt:
 *                       type: string
 *                       description: 마지막 활동 시간
 *                       format: date-time
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: 사용자 ID
 *                         name:
 *                           type: string
 *                           description: 이름
 *                         email:
 *                           type: string
 *                           description: 이메일
 *                     serviceRegions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: 서비스 지역 ID
 *                           profileId:
 *                             type: integer
 *                             description: 프로필 ID
 *                           region:
 *                             type: string
 *                             description: 지역
 *                     serviceTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: 서비스 타입 ID
 *                           profileId:
 *                             type: integer
 *                             description: 프로필 ID
 *                           serviceId:
 *                             type: integer
 *                             description: 서비스 ID
 *                           service:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 description: 서비스 ID
 *                               name:
 *                                 type: string
 *                                 description: 서비스명
 *                               description:
 *                                 type: string
 *                                 description: 서비스 설명
 *                               isActive:
 *                                 type: boolean
 *                                 description: 활성화 여부
 *                               iconUrl:
 *                                 type: string
 *                                 description: 아이콘 URL
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 userId: 4
 *                 nickname: "믿을만한김기사"
 *                 profileImage: "https://s3.amazonaws.com/profiles/profile1.jpg"
 *                 experience: 5
 *                 introduction: "5년 경력의 꼼꼼한 이사 전문가입니다"
 *                 description: "안전하고 신속한 이사를 약속드립니다."
 *                 completedCount: 136
 *                 avgRating: 5.0
 *                 reviewCount: 128
 *                 favoriteCount: 45
 *                 lastActivityAt: "2025-07-10T00:33:16.456Z"
 *                 user:
 *                   id: 4
 *                   name: "김민수"
 *                   email: "mover1@example.com"
 *                 serviceRegions:
 *                   - id: 1
 *                     profileId: 1
 *                     region: "SEOUL"
 *                 serviceTypes:
 *                   - id: 1
 *                     profileId: 1
 *                     serviceId: 1
 *                     service:
 *                       id: 1
 *                       name: "소형이사"
 *                       description: "원룸, 투룸 등 소규모 이사"
 *                       isActive: true
 *                       iconUrl: "https://s3.amazonaws.com/moving-icons/small-moving.svg"
 *       404:
 *         description: 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: 상태 코드
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               status: 404
 *               message: "기사님을 찾을 수 없습니다."
 */
moverRouter.get(
  "/:moverId",
  optionalAuth,
  defaultTranslationMiddleware,
  moverController.getMoverDetailController
);

/**
 * @swagger
 * /movers/{moverId}/quote-request:
 *   post:
 *     summary: 지정 견적 요청
 *     description: 본인 견적(quoteId)에 대해 특정 기사님에게 지정 견적을 요청합니다.
 *     tags: [Mover]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: string
 *         required: true
 *         description: 기사님 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quoteId:
 *                 type: integer
 *                 description: 본인 견적 ID
 *                 required: true
 *               message:
 *                 type: string
 *                 description: 기사님께 전달할 메시지(선택)
 *               expiresAt:
 *                 type: string
 *                 description: 지정 견적 유효기간(ISO 8601)
 *                 format: date-time
 *                 required: true
 *             required:
 *               - quoteId
 *               - expiresAt
 *           example:
 *             quoteId: 4
 *             message: "이사 일정 조율이 필요합니다."
 *             expiresAt: "2025-07-31T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: 지정 견적 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 응답 메시지
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 지정 견적 요청 ID
 *                     quoteId:
 *                       type: integer
 *                       description: 견적 ID
 *                     moverId:
 *                       type: integer
 *                       description: 기사님 ID
 *                     customerId:
 *                       type: integer
 *                       description: 고객 ID
 *                     message:
 *                       type: string
 *                       description: 메시지
 *                     expiresAt:
 *                       type: string
 *                       description: 만료일시
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       description: 상태
 *                     createdAt:
 *                       type: string
 *                       description: 생성일시
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       description: 수정일시
 *                       format: date-time
 *             example:
 *               success: true
 *               message: "지정 견적 요청이 성공적으로 생성되었습니다."
 *               data:
 *                 id: 1
 *                 quoteId: 4
 *                 moverId: 2
 *                 customerId: 9
 *                 message: "이사 일정 조율이 필요합니다."
 *                 expiresAt: "2025-07-31T23:59:59.000Z"
 *                 status: "PENDING"
 *                 createdAt: "2025-07-18T08:00:00.000Z"
 *                 updatedAt: "2025-07-18T08:00:00.000Z"
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               success: false
 *               message: "필수값 누락"
 */
moverRouter.post(
  "/:moverId/quote-request",
  verifyAccessToken,
  moverController.postDesignatedQuoteRequestController
);

/**
 * @swagger
 * /movers/{moverId}/quote-request/check:
 *   get:
 *     summary: 지정 견적 요청 여부 조회
 *     description: 특정 견적(quoteId)에 대해 특정 기사님에게 지정 견적을 요청했는지 확인합니다.
 *     tags: [Mover]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moverId
 *         schema:
 *           type: string
 *         required: true
 *         description: 기사님 ID
 *       - in: query
 *         name: quoteId
 *         schema:
 *           type: string
 *         required: true
 *         description: 견적 ID
 *     responses:
 *       200:
 *         description: 지정 견적 요청 여부 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 응답 메시지
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasRequested:
 *                       type: boolean
 *                       description: 요청 여부
 *                     requestId:
 *                       type: string
 *                       description: 요청 ID
 *                       nullable: true
 *                     message:
 *                       type: string
 *                       description: 메시지
 *                       nullable: true
 *                     expiresAt:
 *                       type: string
 *                       description: 만료일시
 *                       format: date-time
 *                       nullable: true
 *             examples:
 *               requested:
 *                 summary: 요청한 경우
 *                 value:
 *                   success: true
 *                   message: "지정 견적 요청 여부 조회 성공"
 *                   data:
 *                     hasRequested: true
 *                     requestId: "uuid"
 *                     message: "이사 일정 조율이 필요합니다."
 *                     expiresAt: "2025-07-31T23:59:59.000Z"
 *               not_requested:
 *                 summary: 요청하지 않은 경우
 *                 value:
 *                   success: true
 *                   message: "지정 견적 요청 여부 조회 성공"
 *                   data:
 *                     hasRequested: false
 *                     requestId: null
 *                     message: null
 *                     expiresAt: null
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               success: false
 *               message: "잘못된 요청입니다."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 성공 여부
 *                 message:
 *                   type: string
 *                   description: 에러 메시지
 *             example:
 *               success: false
 *               message: "인증이 필요합니다."
 */
moverRouter.get(
  "/:moverId/quote-request/check",
  verifyAccessToken,
  moverController.getDesignatedQuoteRequestCheckController
);

export default moverRouter;

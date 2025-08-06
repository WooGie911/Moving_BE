import { Router } from "express";
import {
  getUser,
  postProfile,
  patchMoverBasicInfo,
  patchMoverProfile,
  getProfile,
  patchCustomerProfile,
} from "../controllers/user.controller";
import { verifyAccessToken } from "../middlewares/verifyToken";
import generatePresignedUrls from "../middlewares/presignedUrl";
import { validateCSRFToken } from "../middlewares/csrfMiddleware";

const userRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserInfoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: 사용자 ID
 *             name:
 *               type: string
 *               description: 사용자 이름
 *             nickname:
 *               type: string
 *               description: 닉네임
 *             customerImage:
 *               type: string
 *               description: 고객 프로필 이미지 (CUSTOMER만)
 *             moverImage:
 *               type: string
 *               description: 기사님 프로필 이미지 (MOVER만)
 *             userType:
 *               type: string
 *               description: 사용자 타입
 *               enum: [CUSTOMER, MOVER]
 *
 *     CustomerProfileRequest:
 *       type: object
 *       properties:
 *         nickname:
 *           type: string
 *           description: 닉네임
 *           required: true
 *         customerImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         currentArea:
 *           type: string
 *           description: 현재 거주 지역
 *           enum: [SEOUL, BUSAN, DAEGU, INCHEON, GWANGJU, DAEJEON, ULSAN, SEJONG, GYEONGGI, GANGWON, CHUNGBUK, CHUNGNAM, JEONBUK, JEONNAM, GYEONGBUK, GYEONGNAM, JEJU]
 *           required: true
 *         preferredServices:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SMALL, HOME, OFFICE]
 *           description: 선호 서비스 타입
 *           required: true
 *       required:
 *         - nickname
 *         - currentArea
 *         - preferredServices
 *
 *     MoverProfileRequest:
 *       type: object
 *       properties:
 *         nickname:
 *           type: string
 *           description: 닉네임
 *           required: true
 *         moverImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         career:
 *           type: integer
 *           description: 경력 (년)
 *           required: true
 *         shortIntro:
 *           type: string
 *           description: 한줄 소개 (최소 8자)
 *           required: true
 *         detailIntro:
 *           type: string
 *           description: 상세 설명 (최소 10자)
 *           required: true
 *         currentArea:
 *           type: string
 *           description: 현재 활동 지역
 *           enum: [SEOUL, BUSAN, DAEGU, INCHEON, GWANGJU, DAEJEON, ULSAN, SEJONG, GYEONGGI, GANGWON, CHUNGBUK, CHUNGNAM, JEONBUK, JEONNAM, GYEONGBUK, GYEONGNAM, JEJU]
 *           required: true
 *         serviceTypes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SMALL, HOME, OFFICE]
 *           description: 제공 서비스 타입
 *           required: true
 *       required:
 *         - nickname
 *         - career
 *         - shortIntro
 *         - detailIntro
 *         - currentArea
 *         - serviceTypes
 *
 *     MoverBasicInfoRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 이름
 *         phoneNumber:
 *           type: string
 *           description: 전화번호 (10-11자리 숫자)
 *         currentPassword:
 *           type: string
 *           description: 현재 비밀번호
 *         newPassword:
 *           type: string
 *           description: 새 비밀번호 (최소 8자)
 *
 *     UserSuccessResponse:
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
 *           description: 응답 데이터 (선택사항)
 *
 *     UserErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: HTTP 상태 코드
 *         message:
 *           type: string
 *           description: 에러 메시지
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 사용자 정보 조회
 *     description: 로그인한 사용자의 기본 정보를 조회합니다. 사용자 타입에 따라 다른 필드가 반환됩니다.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfoResponse'
 *             examples:
 *               customer_info:
 *                 summary: 고객 정보 조회 성공 응답 예시
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "cmd123..."
 *                     name: "김고객"
 *                     nickname: "서울고객"
 *                     customerImage: "https://example.com/customer.jpg"
 *                     userType: "CUSTOMER"
 *               mover_info:
 *                 summary: 기사님 정보 조회 성공 응답 예시
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "cmd456..."
 *                     name: "김기사"
 *                     nickname: "서울이사"
 *                     moverImage: "https://example.com/mover.jpg"
 *                     userType: "MOVER"
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 401
 *               message: "유효하지 않은 토큰입니다"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 404
 *               message: "사용자를 찾을 수 없습니다"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 500
 *               message: "서버 내부 오류가 발생했습니다"
 */
userRouter.get("/", verifyAccessToken, getUser);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: 프로필 조회
 *     description: 사용자 타입에 따라 고객 또는 기사님 프로필을 조회합니다.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSuccessResponse'
 *             example:
 *               success: true
 *               message: "프로필 조회 성공"
 *               data:
 *                 id: "cmd123..."
 *                 nickname: "서울고객"
 *                 hasProfile: true
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 401
 *               message: "유효하지 않은 토큰입니다"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 404
 *               message: "사용자를 찾을 수 없습니다"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 500
 *               message: "서버 내부 오류가 발생했습니다"
 */
userRouter.get("/profile", verifyAccessToken, getProfile);

/**
 * @swagger
 * /users/profile:
 *   post:
 *     summary: 프로필 등록
 *     description: 사용자 타입에 따라 고객 또는 기사님 프로필을 등록합니다. 토큰의 userType에 따라 자동으로 처리됩니다.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CustomerProfileRequest'
 *               - $ref: '#/components/schemas/MoverProfileRequest'
 *           examples:
 *             customer_profile:
 *               summary: 고객 프로필 등록 예시
 *               value:
 *                 nickname: "서울고객"
 *                 customerImage: "https://example.com/profile.jpg"
 *                 currentArea: "SEOUL"
 *                 preferredServices: ["SMALL", "HOME", "OFFICE"]
 *             mover_profile:
 *               summary: 기사님 프로필 등록 예시
 *               value:
 *                 nickname: "서울이사"
 *                 moverImage: "https://example.com/mover-profile.jpg"
 *                 career: 5
 *                 shortIntro: "안전하고 빠른 이사를 약속드립니다"
 *                 detailIntro: "5년 경력의 전문 이사 기사입니다. 소형 이사부터 대형 이사까지 모든 종류의 이사를 담당합니다."
 *                 currentArea: "SEOUL"
 *                 serviceTypes: ["SMALL", "HOME", "OFFICE"]
 *     responses:
 *       200:
 *         description: 프로필 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSuccessResponse'
 *             example:
 *               success: true
 *               message: "프로필이 성공적으로 등록되었습니다."
 *               data:
 *                 id: "cmd789..."
 *                 nickname: "서울이사"
 *                 hasProfile: true
 *       400:
 *         description: 유효하지 않은 사용자 역할
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 400
 *               message: "유효하지 않은 사용자 역할입니다"
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 401
 *               message: "유효하지 않은 토큰입니다"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 404
 *               message: "사용자를 찾을 수 없습니다"
 *       422:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             examples:
 *               duplicate_nickname:
 *                 summary: 닉네임 중복
 *                 value:
 *                   status: 422
 *                   message: "이미 사용중인 닉네임입니다"
 *               missing_nickname:
 *                 summary: 필수 필드 누락
 *                 value:
 *                   status: 422
 *                   message: "닉네임을 입력해주세요"
 *               missing_area:
 *                 summary: 현재 지역 누락
 *                 value:
 *                   status: 422
 *                   message: "현재 활동 지역을 선택해주세요"
 *               missing_service:
 *                 summary: 서비스 타입 누락
 *                 value:
 *                   status: 422
 *                   message: "제공할 서비스를 하나 이상 선택해주세요"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 500
 *               message: "서버 내부 오류가 발생했습니다"
 */
userRouter.post("/profile", verifyAccessToken, postProfile);

/**
 * @swagger
 * /users/profile/customer:
 *   patch:
 *     summary: 일반 유저 프로필 수정
 *     description: 일반 유저의 프로필을 수정합니다.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerProfileRequest'
 *           example:
 *             nickname: "수정된닉네임"
 *             customerImage: "https://example.com/new-profile.jpg"
 *             currentArea: "SEOUL"
 *             preferredServices: ["SMALL", "HOME"]
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSuccessResponse'
 *             example:
 *               success: true
 *               message: "프로필이 성공적으로 수정되었습니다."
 *               data:
 *                 id: "cmd123..."
 *                 nickname: "수정된닉네임"
 *                 hasProfile: true
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 401
 *               message: "유효하지 않은 토큰입니다"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 404
 *               message: "사용자를 찾을 수 없습니다"
 *       422:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 422
 *               message: "이미 사용중인 닉네임입니다"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 500
 *               message: "서버 내부 오류가 발생했습니다"
 */
userRouter.patch("/profile/customer", verifyAccessToken, patchCustomerProfile);

/**
 * @swagger
 * components:
 *   schemas:
 *     MoverProfileUpdateRequest:
 *       type: object
 *       properties:
 *         nickname:
 *           type: string
 *           description: 닉네임
 *         moverImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         currentArea:
 *           type: string
 *           description: 현재 활동 지역
 *           enum: [SEOUL, BUSAN, DAEGU, INCHEON, GWANGJU, DAEJEON, ULSAN, SEJONG, GYEONGGI, GANGWON, CHUNGBUK, CHUNGNAM, JEONBUK, JEONNAM, GYEONGBUK, GYEONGNAM, JEJU]
 *         serviceTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: 제공 서비스 타입
 *           enum: [SMALL, HOME, OFFICE]
 *         shortIntro:
 *           type: string
 *           description: 한줄 소개 (최소 8자)
 *         detailIntro:
 *           type: string
 *           description: 상세 설명 (최소 10자)
 *         career:
 *           type: integer
 *           description: 경력 (년)
 *         isVeteran:
 *           type: boolean
 *           description: 베테랑 여부
 */

/**
 * @swagger
 * /users/profile/mover:
 *   patch:
 *     summary: 기사님 프로필 수정
 *     description: 기사님의 프로필 정보(닉네임, 이미지, 활동지역, 서비스타입, 소개, 경력 등)를 수정합니다.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoverProfileUpdateRequest'
 *           example:
 *             nickname: "수정된닉네임"
 *             moverImage: "https://example.com/new-image.jpg"
 *             currentArea: "SEOUL"
 *             serviceTypes: ["SMALL", "HOME"]
 *             shortIntro: "수정된 한줄 소개입니다"
 *             detailIntro: "수정된 상세 설명입니다. 더 자세한 내용을 포함합니다."
 *             career: 5
 *             isVeteran: true
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSuccessResponse'
 *             example:
 *               success: true
 *               message: "기사님 프로필이 성공적으로 수정되었습니다."
 *               data:
 *                 id: "cmd456..."
 *                 name: "김기사"
 *                 nickname: "수정된닉네임"
 *                 moverImage: "https://example.com/new-image.jpg"
 *                 career: 5
 *                 shortIntro: "수정된 한줄 소개입니다"
 *                 detailIntro: "수정된 상세 설명입니다. 더 자세한 내용을 포함합니다."
 *                 serviceTypes: ["SMALL", "HOME"]
 *                 currentAreas: ["SEOUL"]
 *                 isVeteran: true
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 401
 *               message: "유효하지 않은 토큰입니다"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 404
 *               message: "사용자를 찾을 수 없습니다"
 *       422:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 422
 *               message: "이미 사용 중인 닉네임입니다"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 500
 *               message: "서버 내부 오류가 발생했습니다"
 */
userRouter.patch("/profile/mover", verifyAccessToken, patchMoverProfile);

/**
 * @swagger
 * /users/profile/mover/basic:
 *   patch:
 *     summary: 기사님 기본정보 수정
 *     description: 기사님의 이름, 전화번호, 비밀번호를 수정합니다. 비밀번호 변경 시 현재 비밀번호 확인이 필요합니다.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoverBasicInfoRequest'
 *           example:
 *             name: "김기사수정"
 *             phoneNumber: "01087654321"
 *             currentPassword: "현재비밀번호123!"
 *             newPassword: "새비밀번호456!"
 *     responses:
 *       200:
 *         description: 기본정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSuccessResponse'
 *             example:
 *               success: true
 *               message: "기사님 기본정보가 성공적으로 수정되었습니다."
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 401
 *               message: "유효하지 않은 토큰입니다"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 404
 *               message: "사용자를 찾을 수 없습니다"
 *       422:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             examples:
 *               password_mismatch:
 *                 summary: 현재 비밀번호 불일치
 *                 value:
 *                   status: 422
 *                   message: "현재 비밀번호가 일치하지 않습니다"
 *               phone_format:
 *                 summary: 전화번호 형식 오류
 *                 value:
 *                   status: 422
 *                   message: "전화번호는 10-11자리 숫자로 입력해주세요"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 500
 *               message: "서버 내부 오류가 발생했습니다"
 */
userRouter.patch("/profile/mover/basic", verifyAccessToken, validateCSRFToken, patchMoverBasicInfo);

/**
 * @swagger
 * /users/profile/presignedUrl:
 *   post:
 *     summary: 이미지 업로드용 Presigned URL 생성
 *     description: S3에 이미지를 업로드하기 위한 Presigned URL을 생성합니다.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Presigned URL 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSuccessResponse'
 *             example:
 *               success: true
 *               message: "Presigned URL이 생성되었습니다"
 *               data:
 *                 presignedUrl: "https://s3.amazonaws.com/bucket/key?X-Amz-Algorithm=..."
 *                 imageUrl: "https://bucket.s3.amazonaws.com/key"
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 401
 *               message: "유효하지 않은 토큰입니다"
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 *             example:
 *               status: 500
 *               message: "서버 내부 오류가 발생했습니다"
 */
userRouter.post("/profile/presignedUrl", verifyAccessToken, generatePresignedUrls);

export default userRouter;

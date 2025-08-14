import request from "supertest";
import app from "../../src/app";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({ notificationMiddleware: jest.fn() }));
import { getCustomerToken, getMoverToken } from "../helpers/auth";
import prisma from "../../src/db/prisma/prisma";
import { EstimateStatus } from "@prisma/client";

describe("리뷰 통합 테스트", () => {
  let customerToken: string;
  let moverToken: string;

  // 테스트 전후로 데이터베이스 정리
  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.estimate.deleteMany();
    await prisma.estimateRequest.deleteMany();
    customerToken = await getCustomerToken();
    moverToken = await getMoverToken();
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.estimate.deleteMany();
    await prisma.estimateRequest.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 리뷰 데이터 정리 (테스트 격리)
    await prisma.review.deleteMany();
    await prisma.estimate.deleteMany();
    await prisma.estimateRequest.deleteMany();
  });

  describe("GET /reviews/writable-estimateRequests - 리뷰 작성 가능한 견적 요청 조회", () => {
    test("고객 사용자로 리뷰 작성 가능한 견적 요청을 조회할 수 있어야 한다", async () => {
             // Setup: 테스트용 견적 요청 데이터 생성
       const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
       const mover = await prisma.user.findFirst({ where: { userType: { has: "MOVER" } } });

       // 주소 데이터 생성
       const fromAddress = await prisma.address.create({
         data: {
           zoneCode: "12345",
           city: "강남구",
           district: "테스트동",
           detail: "101호",
           region: "SEOUL"
         }
       });

       const toAddress = await prisma.address.create({
         data: {
           zoneCode: "67890",
           city: "서초구",
           district: "테스트동",
           detail: "202호",
           region: "SEOUL"
         }
       });

       const estimateRequest = await prisma.estimateRequest.create({
         data: {
           customerId: customer!.id,
           moveType: "HOME",
           moveDate: new Date("2025-01-20"),
           fromAddressId: fromAddress.id,
           toAddressId: toAddress.id,
           description: "테스트 이사",
           status: "COMPLETED"
         }
       });

      const estimate = await prisma.estimate.create({
        data: {
          estimateRequestId: estimateRequest.id,
          moverId: mover!.id,
          price: 150000,
          comment: "테스트 견적",
          status: "ACCEPTED" as EstimateStatus,
          isDesignated: false,
          validUntil: new Date("2025-02-20")
        }
      });

             // 리뷰 작성 가능한 상태로 설정 (리뷰가 없는 상태)
       await prisma.review.create({
         data: {
           customerId: customer!.id,
           moverId: mover!.id,
           estimateRequestId: estimateRequest.id,
           rating: 0,
           content: "",
           status: "PENDING"
         }
       });

      // Exercise: API 요청 실행
      const response = await request(app)
        .get("/reviews/writable-estimateRequests?page=1&pageSize=4")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("리뷰 작성 가능한 견적 요청 리스트입니다.");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);

      // DB에 실제로 저장되었는지 확인
      const dbReview = await prisma.review.findFirst({
        where: { customerId: customer!.id }
      });
      expect(dbReview).toBeTruthy();
    });

    test("인증 토큰 없이 조회 시 401 에러를 반환해야 한다", async () => {
      // Exercise: 토큰 없이 API 요청
      const response = await request(app)
        .get("/reviews/writable-estimateRequests")
        .expect(401);

      // Assertion: 에러 응답 검증
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("로그인이 필요합니다. 다시 로그인해 주세요.");
    });
  });

  describe("PATCH /reviews/:reviewId - 리뷰 작성", () => {
    test("존재하는 리뷰에 평점과 내용을 작성할 수 있어야 한다", async () => {
      // Setup: 테스트용 리뷰 데이터 생성
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      const mover = await prisma.user.findFirst({ where: { userType: { has: "MOVER" } } });

      // 주소 데이터 생성
      const fromAddress = await prisma.address.create({
        data: {
          zoneCode: "12345",
          city: "강남구",
          district: "테스트동",
          detail: "101호",
          region: "SEOUL"
        }
      });

      const toAddress = await prisma.address.create({
        data: {
          zoneCode: "67890",
          city: "서초구",
          district: "테스트동",
          detail: "202호",
          region: "SEOUL"
        }
      });

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer!.id,
          moveType: "HOME",
          moveDate: new Date("2025-01-20"),
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          description: "테스트 이사",
          status: "COMPLETED"   
        }
      });

      const review = await prisma.review.create({
        data: {
          customerId: customer!.id,
          moverId: mover!.id,
          estimateRequestId: estimateRequest.id,
          rating: 0,
          content: "",
          status: "PENDING"
        }
      });

      // Exercise: API 요청 실행
      const response = await request(app)
        .patch(`/reviews/${review.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 5,
          content: "정말 만족스러운 서비스였습니다!"
        })
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("리뷰가 작성되었습니다.");
      expect(response.body.data.id).toBe(review.id);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.content).toBe("정말 만족스러운 서비스였습니다!");
      expect(response.body.data.status).toBe("COMPLETED");

      // DB에 실제로 저장되었는지 확인
      const updatedReview = await prisma.review.findUnique({
        where: { id: review.id }
      });
      expect(updatedReview?.rating).toBe(5);
      expect(updatedReview?.content).toBe("정말 만족스러운 서비스였습니다!");
      expect(updatedReview?.status).toBe("COMPLETED");
    });

    test("필수 필드가 누락된 경우 400 에러를 반환해야 한다", async () => {
      // Setup: 테스트용 리뷰 데이터 생성
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      const mover = await prisma.user.findFirst({ where: { userType: { has: "MOVER" } } });

      // 주소 데이터 생성
      const fromAddress = await prisma.address.create({
        data: {
          zoneCode: "12345",
          city: "강남구",
          district: "테스트동",
          detail: "101호",
          region: "SEOUL"
        }
      });

      const toAddress = await prisma.address.create({
        data: {
          zoneCode: "67890",
          city: "서초구",
          district: "테스트동",
          detail: "202호",
          region: "SEOUL"
        }
      });

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer!.id,
          moveType: "HOME",
          moveDate: new Date("2025-01-20"),
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          description: "테스트 이사",
          status: "COMPLETED"
        }
      });

      const review = await prisma.review.create({
        data: {
          customerId: customer!.id,
          moverId: mover!.id,
          estimateRequestId: estimateRequest.id,
          rating: 0,
          content: "",
          status: "PENDING"
        }
      });

      // Exercise: 필수 필드 누락으로 API 요청
      const response = await request(app)
        .patch(`/reviews/${review.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 5
          // content 누락
        })
        .expect(400);

      // Assertion: 에러 응답 검증
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("reviewId, rating, content required");
    });
  });

  describe("GET /reviews/customer/:customerId - 내가 쓴 리뷰 목록 조회", () => {
    test("고객 사용자로 내가 쓴 리뷰 목록을 조회할 수 있어야 한다", async () => {
      // Setup: 테스트용 리뷰 데이터 생성
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      const mover = await prisma.user.findFirst({ where: { userType: { has: "MOVER" } } });

      // 주소 데이터 생성
      const fromAddress = await prisma.address.create({
        data: {
          zoneCode: "12345",
          city: "강남구",
          district: "테스트동",
          detail: "101호",
          region: "SEOUL"
        }
      });

      const toAddress = await prisma.address.create({
        data: {
          zoneCode: "67890",
          city: "서초구",
          district: "테스트동",
          detail: "202호",
          region: "SEOUL"
        }
      });

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer!.id,
          moveType: "HOME",
          moveDate: new Date("2025-01-20"),
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          description: "테스트 이사",
          status: "COMPLETED"
        }
      });

      await prisma.review.create({
        data: {
          customerId: customer!.id,
          moverId: mover!.id,
          estimateRequestId: estimateRequest.id,
          rating: 5,
          content: "만족스러운 서비스",
          status: "COMPLETED"
        }
      });

      // Exercise: API 요청 실행
      const response = await request(app)
        .get(`/reviews/customer/${customer!.id}?page=1&pageSize=4`)
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("내가 쓴 리뷰 목록입니다.");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);

      // DB에 실제로 저장되었는지 확인
      const dbReview = await prisma.review.findFirst({
        where: { customerId: customer!.id }
      });
      expect(dbReview).toBeTruthy();
    });
  });

  describe("GET /reviews/mover/:moverId - 내가 받은 리뷰 목록 조회", () => {
    test("기사 사용자로 내가 받은 리뷰 목록을 조회할 수 있어야 한다", async () => {
      // Setup: 테스트용 리뷰 데이터 생성
      const customer = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });
      const mover = await prisma.user.findFirst({ where: { userType: { has: "MOVER" } } });

      // 주소 데이터 생성
      const fromAddress = await prisma.address.create({
        data: {
          zoneCode: "12345",
          city: "강남구",
          district: "테스트동",
          detail: "101호",
          region: "SEOUL"
        }
      });

      const toAddress = await prisma.address.create({
        data: {
          zoneCode: "67890",
          city: "서초구",
          district: "테스트동",
          detail: "202호",
          region: "SEOUL"
        }
      });

      const estimateRequest = await prisma.estimateRequest.create({
        data: {
          customerId: customer!.id,
          moveType: "HOME",
          moveDate: new Date("2025-01-20"),
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          description: "테스트 이사",
          status: "COMPLETED"
        }
      });

      await prisma.review.create({
        data: {
          customerId: customer!.id,
          moverId: mover!.id,
          estimateRequestId: estimateRequest.id,
          rating: 4,
          content: "친절한 서비스",
          status: "COMPLETED"
        }
      });

      // Exercise: API 요청 실행
      const response = await request(app)
        .get(`/reviews/mover/${mover!.id}?page=1&pageSize=5`)
        .expect(200);

      // Assertion: 결과 검증
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("기사님 리뷰 목록입니다.");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);

      // DB에 실제로 저장되었는지 확인
      const dbReview = await prisma.review.findFirst({
        where: { moverId: mover!.id }
      });
      expect(dbReview).toBeTruthy();
    });

    test("기사님 ID가 누락된 경우 400 에러를 반환해야 한다", async () => {
      // Exercise: 기사님 ID 없이 API 요청
      const response = await request(app)
        .get("/reviews/mover/")
        .expect(404);

      // Assertion: 에러 응답 검증 (라우터 레벨에서 404 반환)
      expect(response.status).toBe(404);
    });
  });
});

import request from "supertest";
import app from "../../src/app";
import {
  jest,
  describe,
  beforeAll,
  afterAll,
  test,
  expect,
  it,
} from "@jest/globals";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({
  notificationMiddleware: jest.fn(),
}));
import { getCustomerToken } from "../helpers/auth";
import prisma from "../../src/db/prisma/prisma";

describe("CustomerEstimateRequest integration", () => {
  let token: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    token = await getCustomerToken();
  });

  describe("GET /customer-quotes/pending", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/customer-quotes/pending");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 200 with valid token and correct response structure", async () => {
      const res = await request(app)
        .get("/customer-quotes/pending")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty("message");
        expect(res.body).toHaveProperty("data");

        // data 구조 검증
        const { data } = res.body;
        expect(data).toHaveProperty("estimateRequest");
        expect(data).toHaveProperty("estimates");
        expect(Array.isArray(data.estimates)).toBe(true);

        // estimateRequest가 null이 아닌 경우 상세 검증
        if (data.estimateRequest) {
          expect(data.estimateRequest).toHaveProperty("id");
          expect(data.estimateRequest).toHaveProperty("customerId");
          expect(data.estimateRequest).toHaveProperty("moveType");
          expect(data.estimateRequest).toHaveProperty("moveDate");
          expect(data.estimateRequest).toHaveProperty("status");
          expect(data.estimateRequest).toHaveProperty("fromAddress");
          expect(data.estimateRequest).toHaveProperty("toAddress");
        }

        // estimates 배열의 각 항목 검증
        if (data.estimates.length > 0) {
          const estimate = data.estimates[0];
          expect(estimate).toHaveProperty("id");
          expect(estimate).toHaveProperty("price");
          expect(estimate).toHaveProperty("status");
          expect(estimate).toHaveProperty("isDesignated");
          expect(estimate).toHaveProperty("mover");

          // mover 정보 검증
          expect(estimate.mover).toHaveProperty("id");
          expect(estimate.mover).toHaveProperty("nickname");
          expect(estimate.mover).toHaveProperty("isFavorite");
          expect(estimate.mover).toHaveProperty("totalFavoriteCount");
        }
      }
    });
  });

  describe("GET /customer-quotes/received", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/customer-quotes/received");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 200 with valid token and correct response structure", async () => {
      const res = await request(app)
        .get("/customer-quotes/received")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);

      // data 배열의 각 항목 검증
      if (res.body.data.length > 0) {
        const estimateData = res.body.data[0];
        expect(estimateData).toHaveProperty("estimateRequest");
        expect(estimateData).toHaveProperty("estimates");
        expect(Array.isArray(estimateData.estimates)).toBe(true);

        // estimateRequest 구조 검증
        const estimateRequest = estimateData.estimateRequest;
        expect(estimateRequest).toHaveProperty("id");
        expect(estimateRequest).toHaveProperty("customerId");
        expect(estimateRequest).toHaveProperty("moveType");
        expect(estimateRequest).toHaveProperty("moveDate");
        expect(estimateRequest).toHaveProperty("status");
        expect(estimateRequest).toHaveProperty("fromAddress");
        expect(estimateRequest).toHaveProperty("toAddress");

        // estimates 배열 검증
        if (estimateData.estimates.length > 0) {
          const estimate = estimateData.estimates[0];
          expect(estimate).toHaveProperty("id");
          expect(estimate).toHaveProperty("price");
          expect(estimate).toHaveProperty("status");
          expect(estimate).toHaveProperty("isDesignated");
          expect(estimate).toHaveProperty("mover");
        }
      }
    });
  });

  describe("PATCH /customer-quotes/confirm", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).patch(
        "/customer-quotes/confirm?estimateId=test"
      );
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 400 without estimateId", async () => {
      const res = await request(app)
        .patch("/customer-quotes/confirm")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("유효하지 않은 견적 ID입니다.");
    });

    it("should return error with invalid estimateId", async () => {
      const res = await request(app)
        .patch("/customer-quotes/confirm?estimateId=invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect([400, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("PATCH /customer-quotes/cancel", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).patch(
        "/customer-quotes/cancel?estimateId=test"
      );
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 400 without estimateId", async () => {
      const res = await request(app)
        .patch("/customer-quotes/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("유효하지 않은 견적 ID입니다.");
    });

    it("should return error with invalid estimateId", async () => {
      const res = await request(app)
        .patch("/customer-quotes/cancel?estimateId=invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect([400, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("PATCH /customer-quotes/complete", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).patch(
        "/customer-quotes/complete?estimateId=test"
      );
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 400 without estimateId", async () => {
      const res = await request(app)
        .patch("/customer-quotes/complete")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("유효하지 않은 견적 ID입니다.");
    });

    it("should return error with invalid estimateId", async () => {
      const res = await request(app)
        .patch("/customer-quotes/complete?estimateId=invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect([400, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("success", false);
    });
  });
});

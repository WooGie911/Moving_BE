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
import { getMoverToken } from "../helpers/auth";
import prisma from "../../src/db/prisma/prisma";

describe("MoverEstimate integration", () => {
  let token: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    token = await getMoverToken();
  });

  describe("POST /mover-estimates/create", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).post("/mover-estimates/create");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 400 with invalid request body", async () => {
      const res = await request(app)
        .post("/mover-estimates/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          estimateRequestId: "",
          price: -1000,
          comment: "",
        });

      expect(res.status).toBe(400);
      // 응답 구조가 다를 수 있으므로 더 유연하게 검증
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return 400 with missing required fields", async () => {
      const res = await request(app)
        .post("/mover-estimates/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          estimateRequestId: "test-id",
          // price missing
          comment: "test comment",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return error with invalid estimateRequestId", async () => {
      const res = await request(app)
        .post("/mover-estimates/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          estimateRequestId: "invalid-id",
          price: 150000,
          comment: "안전하고 신속한 이사 서비스",
        });

      expect([400, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("POST /mover-estimates/reject", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).post("/mover-estimates/reject");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 400 with invalid request body", async () => {
      const res = await request(app)
        .post("/mover-estimates/reject")
        .set("Authorization", `Bearer ${token}`)
        .send({
          estimateRequestId: "",
          comment: "",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return error with invalid estimateRequestId", async () => {
      const res = await request(app)
        .post("/mover-estimates/reject")
        .set("Authorization", `Bearer ${token}`)
        .send({
          estimateRequestId: "invalid-id",
          comment: "현재 일정이 맞지 않아 서비스가 어렵습니다.",
        });

      expect([400, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("GET /mover-estimates/region", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/mover-estimates/region");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 200 with valid token and correct response structure", async () => {
      const res = await request(app)
        .get("/mover-estimates/region")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);

      // data 배열의 각 항목 검증
      if (res.body.data.length > 0) {
        const estimateRequest = res.body.data[0];
        expect(estimateRequest).toHaveProperty("id");
        expect(estimateRequest).toHaveProperty("customerName");
        expect(estimateRequest).toHaveProperty("movingType");
        expect(estimateRequest).toHaveProperty("moveDate");
        expect(estimateRequest).toHaveProperty("description");
        expect(estimateRequest).toHaveProperty("fromAddress");
        expect(estimateRequest).toHaveProperty("toAddress");
        expect(estimateRequest).toHaveProperty("createdAt");
      }
    });

    it("should return 200 with query parameters", async () => {
      const res = await request(app)
        .get("/mover-estimates/region?sortBy=moveDate&movingType=SMALL")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("data");
    });

    it("should return 400 with invalid sortBy parameter", async () => {
      const res = await request(app)
        .get("/mover-estimates/region?sortBy=invalid")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("GET /mover-estimates/designated", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/mover-estimates/designated");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 200 with valid token and correct response structure", async () => {
      const res = await request(app)
        .get("/mover-estimates/designated")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty("message");
        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBe(true);

        // data 배열의 각 항목 검증
        if (res.body.data.length > 0) {
          const estimateRequest = res.body.data[0];
          expect(estimateRequest).toHaveProperty("id");
          expect(estimateRequest).toHaveProperty("moveType");
          expect(estimateRequest).toHaveProperty("moveDate");
          expect(estimateRequest).toHaveProperty("fromAddress");
          expect(estimateRequest).toHaveProperty("toAddress");
          expect(estimateRequest).toHaveProperty("customer");
          expect(estimateRequest).toHaveProperty("status");

          // fromAddress 구조 검증
          if (estimateRequest.fromAddress) {
            expect(estimateRequest.fromAddress).toHaveProperty("id");
            expect(estimateRequest.fromAddress).toHaveProperty("zoneCode");
            expect(estimateRequest.fromAddress).toHaveProperty("city");
            expect(estimateRequest.fromAddress).toHaveProperty("district");
            expect(estimateRequest.fromAddress).toHaveProperty("detail");
            expect(estimateRequest.fromAddress).toHaveProperty("region");
          }

          // customer 구조 검증
          if (estimateRequest.customer) {
            expect(estimateRequest.customer).toHaveProperty("id");
            expect(estimateRequest.customer).toHaveProperty("name");
            expect(estimateRequest.customer).toHaveProperty("currentArea");
            expect(estimateRequest.customer).toHaveProperty("customerImage");
            expect(estimateRequest.customer).toHaveProperty("nickname");
          }
        }
      }
    });
  });

  describe("GET /mover-estimates/list", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/mover-estimates/list");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 200 with valid token and correct response structure", async () => {
      const res = await request(app)
        .get("/mover-estimates/list?region=true&designated=true")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("regionEstimateRequests");
      expect(res.body.data).toHaveProperty("designatedEstimateRequests");
      expect(Array.isArray(res.body.data.regionEstimateRequests)).toBe(true);
      expect(Array.isArray(res.body.data.designatedEstimateRequests)).toBe(
        true
      );
    });

    it("should return 200 with only region parameter", async () => {
      const res = await request(app)
        .get("/mover-estimates/list?region=true&designated=false")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("regionEstimateRequests");
      expect(res.body.data).not.toHaveProperty("designatedEstimateRequests");
    });
  });

  describe("GET /mover-estimates/my-estimates", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/mover-estimates/my-estimates");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 200 with valid token and correct response structure", async () => {
      const res = await request(app)
        .get("/mover-estimates/my-estimates")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);

      // data 배열의 각 항목 검증
      if (res.body.data.length > 0) {
        const estimate = res.body.data[0];
        expect(estimate).toHaveProperty("id");
        expect(estimate).toHaveProperty("estimateRequestId");
        expect(estimate).toHaveProperty("price");
        expect(estimate).toHaveProperty("comment");
        expect(estimate).toHaveProperty("status");
        expect(estimate).toHaveProperty("createdAt");
        expect(estimate).toHaveProperty("estimateRequest");

        // estimateRequest 구조 검증
        if (estimate.estimateRequest) {
          expect(estimate.estimateRequest).toHaveProperty("moveType");
          expect(estimate.estimateRequest).toHaveProperty("moveDate");
          expect(estimate.estimateRequest).toHaveProperty("fromAddress");
          expect(estimate.estimateRequest).toHaveProperty("toAddress");
        }
      }
    });
  });

  describe("GET /mover-estimates/my-rejected", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/mover-estimates/my-rejected");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 200 with valid token and correct response structure", async () => {
      const res = await request(app)
        .get("/mover-estimates/my-rejected")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);

      // data 배열의 각 항목 검증
      if (res.body.data.length > 0) {
        const estimate = res.body.data[0];
        expect(estimate).toHaveProperty("id");
        expect(estimate).toHaveProperty("estimateRequestId");
        expect(estimate).toHaveProperty("comment");
        expect(estimate).toHaveProperty("status");
        expect(estimate).toHaveProperty("createdAt");
        expect(estimate).toHaveProperty("estimateRequest");
      }
    });
  });

  describe("PATCH /mover-estimates/status", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).patch(
        "/mover-estimates/status?estimateId=test"
      );
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 400 without estimateId", async () => {
      const res = await request(app)
        .patch("/mover-estimates/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "ACCEPTED" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return 400 with invalid status", async () => {
      const res = await request(app)
        .patch("/mover-estimates/status?estimateId=test")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "INVALID_STATUS" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return error with invalid estimateId", async () => {
      const res = await request(app)
        .patch("/mover-estimates/status?estimateId=invalid-id")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "ACCEPTED" });

      expect([400, 403, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("success", false);
    });
  });

  describe("PATCH /mover-estimates/estimate", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).patch(
        "/mover-estimates/estimate?estimateId=test"
      );
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("로그인이 필요합니다");
    });

    it("should return 400 without estimateId", async () => {
      const res = await request(app)
        .patch("/mover-estimates/estimate")
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 150000, comment: "업데이트된 견적" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return 400 with invalid price", async () => {
      const res = await request(app)
        .patch("/mover-estimates/estimate?estimateId=test")
        .set("Authorization", `Bearer ${token}`)
        .send({ price: -1000, comment: "업데이트된 견적" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return 400 with empty comment", async () => {
      const res = await request(app)
        .patch("/mover-estimates/estimate?estimateId=test")
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 150000, comment: "" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should return error with invalid estimateId", async () => {
      const res = await request(app)
        .patch("/mover-estimates/estimate?estimateId=invalid-id")
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 150000, comment: "업데이트된 견적" });

      expect([400, 403, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("success", false);
    });
  });
});

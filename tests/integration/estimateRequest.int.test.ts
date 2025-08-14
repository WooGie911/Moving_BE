import request from "supertest";
import app from "../../src/app";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({ notificationMiddleware: jest.fn() }));
import { getCustomerToken } from "../helpers/auth";
import prisma from "../../src/db/prisma/prisma";

describe("EstimateRequest integration", () => {
  let token: string;
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    token = await getCustomerToken();
  });

  it("POST /estimateRequests/create - 201|409", async () => {
    // 사전 정리: 기존 활성 요청이 있으면 삭제 시도
    await request(app).delete("/estimateRequests/active").set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post("/estimateRequests/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        movingType: "home",
        movingDate: "2026-01-20",
        isDateConfirmed: true,
        departure: { roadAddress: "서울 강남구 도산대로 602", detailAddress: "501호", zonecode: "12521" },
        arrival: { roadAddress: "제주도 서귀포시 대정읍 새시대로 115", detailAddress: "402호", zonecode: "12361" },
        description: "통합테스트 생성",
      });
    expect([200, 201, 409]).toContain(res.status);
  });

  it("GET /estimateRequests/active - 200", async () => {
    const res = await request(app).get("/estimateRequests/active").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

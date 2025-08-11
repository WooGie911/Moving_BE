import request from "supertest";
import app from "../../src/app";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({ notificationMiddleware: jest.fn() }));
import prisma from "../../src/db/prisma/prisma";
import { getCustomerToken } from "../helpers/auth";

describe("Favorite integration", () => {
  let token: string, moverId: string;
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    token = await getCustomerToken();
    const mover = await prisma.user.findFirst({ where: { userType: { has: "MOVER" } } });
    if (!mover) throw new Error("테스트용 기사 사용자를 찾거나 생성해 주세요.");
    moverId = mover.id;
  });

  it("POST /favorites - 201/200", async () => {
    const res = await request(app).post("/favorites").set("Authorization", `Bearer ${token}`).send({ moverId });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it("GET /favorites/movers - 200", async () => {
    const res = await request(app).get("/favorites/movers?limit=3").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

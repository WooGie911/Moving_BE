import request from "supertest";
import app from "../../src/app";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({
  notificationMiddleware: jest.fn(),
}));
import prisma from "../../src/db/prisma/prisma";
import { getCustomerToken } from "../helpers/auth";

describe("MoverDetail integration", () => {
  let token: string, moverId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    token = await getCustomerToken();
    const mover = await prisma.user.findFirst({
      where: { userType: { has: "MOVER" } },
    });
    if (!mover) throw new Error("테스트용 기사 사용자를 찾거나 생성해 주세요.");
    moverId = mover.id;
  });

  it("GET /movers/:id - 200", async () => {
    const res = await request(app).get(`/movers/${moverId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(moverId);
    expect(res.body.data.nickname).toBeDefined();
    expect(res.body.data.experience).toBeDefined();
  });

  it("GET /movers/:id with auth - 200", async () => {
    const res = await request(app)
      .get(`/movers/${moverId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isFavorited).toBeDefined();
  });

  it("GET /movers/:id - 404 for invalid id", async () => {
    const res = await request(app).get("/movers/invalid-id");
    expect(res.status).toBe(404);
  });
});

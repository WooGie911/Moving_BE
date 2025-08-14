import request from "supertest";
import app from "../../src/app";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({
  notificationMiddleware: jest.fn(),
}));
import prisma from "../../src/db/prisma/prisma";
import { getCustomerToken } from "../helpers/auth";

describe("MoverSearch integration", () => {
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

  it("GET /movers - 200", async () => {
    const res = await request(app).get("/movers");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("GET /movers with region filter - 200", async () => {
    const res = await request(app).get("/movers?region=SEOUL");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
  });

  it("GET /movers/favorite - 200", async () => {
    const res = await request(app)
      .get("/movers/favorite")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

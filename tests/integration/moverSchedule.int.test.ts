import request from "supertest";
import app from "../../src/app";
jest.mock("../../src/middlewares/notificationMiddleware", () => ({ notificationMiddleware: jest.fn() }));
import { getMoverToken } from "../helpers/auth";
import prisma from "../../src/db/prisma/prisma";

describe("MoverSchedule integration", () => {
  let token: string;
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    token = await getMoverToken();
  });

  it("GET /mover-schedules/monthly/:year/:month - 200", async () => {
    const res = await request(app).get("/mover-schedules/monthly/2025/8").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

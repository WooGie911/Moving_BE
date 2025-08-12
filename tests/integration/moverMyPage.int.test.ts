import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/db/prisma/prisma";


const getCookies = (res: any) => {
  const raw = res.headers["set-cookie"];
  const cookies: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  expect(cookies).toBeDefined();
  expect(Array.isArray(cookies)).toBe(true);
  return cookies;
};

beforeAll(() => {
  (app as any).set("trust proxy", 1);
});

describe("기사님 마이페이지 통합 테스트", () => {
  let accessToken: string;
  let moverUserId: string;

  beforeAll(async () => {
    let signin;
    const possiblePasswords = [
      "Test!Pass5@2024",
      "NewPassword123!@"
    ];
    
    for (const password of possiblePasswords) {
      try {
        signin = await request(app)
          .post("/auth/sign-in")
          .send({
            email: "mover5@test.com",
            password: password,
            userType: "MOVER",
          })
          .expect(200);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!signin) {
      throw new Error("모든 비밀번호로 로그인 시도 실패");
    }

    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    );
    accessToken = accessCookie!.split(";")[0].split("=")[1];

    const userRes = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    moverUserId = userRes.body.data.id;
  });

  afterAll(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.log("Prisma 연결 해제 중 오류:", error);
    }
  });

  it("GET /users - 사용자 기본 정보 조회", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("name");
    expect(res.body.data).toHaveProperty("email");
    expect(res.body.data).toHaveProperty("userType");
    expect(res.body.data.userType).toBe("MOVER");
  });

  it("GET /users/profile - 기사님 프로필 정보 조회", async () => {
    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("nickname");
    expect(res.body.data).toHaveProperty("name");
    expect(res.body.data).toHaveProperty("career");
    expect(res.body.data).toHaveProperty("shortIntro");
    expect(res.body.data).toHaveProperty("detailIntro");
    expect(res.body.data).toHaveProperty("serviceTypes");
    expect(res.body.data).toHaveProperty("currentAreas");
  });

  it("GET /movers/{moverId} - 기사님 상세 정보 조회", async () => {
    const res = await request(app)
      .get(`/movers/${moverUserId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("nickname");
    expect(res.body.data).toHaveProperty("experience");
    expect(res.body.data).toHaveProperty("introduction");
    expect(res.body.data).toHaveProperty("description");
    expect(res.body.data).toHaveProperty("serviceTypes");
    expect(res.body.data).toHaveProperty("serviceRegions");
    expect(res.body.data).toHaveProperty("completedCount");
    expect(res.body.data).toHaveProperty("avgRating");
    expect(res.body.data).toHaveProperty("reviewCount");
    expect(res.body.data).toHaveProperty("favoriteCount");
  });

  it("GET /reviews/mover/{moverId} - 기사님이 받은 리뷰 조회", async () => {
    const res = await request(app)
      .get(`/reviews/mover/${moverUserId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("items");
    expect(res.body.data).toHaveProperty("total");
    expect(res.body.data).toHaveProperty("page");
    expect(res.body.data).toHaveProperty("pageSize");
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });



  it("기사님 마이페이지 통합 데이터 검증", async () => {
    const userRes = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const profileRes = await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const moverDetailRes = await request(app)
      .get(`/movers/${moverUserId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const reviewsRes = await request(app)
      .get(`/reviews/mover/${moverUserId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(userRes.body.data.id).toBe(moverUserId);
    expect(moverDetailRes.body.data.id).toBe(moverUserId);
    
    expect(userRes.body.data.userType).toBe("MOVER");
    
    if (profileRes.body.data.nickname && moverDetailRes.body.data.nickname) {
      expect(profileRes.body.data.nickname).toBe(moverDetailRes.body.data.nickname);
    }

    expect(moverDetailRes.body.data).toHaveProperty("completedCount");
    expect(moverDetailRes.body.data).toHaveProperty("avgRating");
    expect(moverDetailRes.body.data).toHaveProperty("experience");
    expect(moverDetailRes.body.data).toHaveProperty("serviceTypes");
    expect(moverDetailRes.body.data).toHaveProperty("serviceRegions");
    expect(reviewsRes.body.data).toHaveProperty("items");
  });

  it("401: 토큰 미제공 시 마이페이지 접근 실패", async () => {
    await request(app)
      .get("/users")
      .expect(401);

    await request(app)
      .get("/users/profile")
      .expect(401);
  });

  it("401: 잘못된 토큰으로 마이페이지 접근 실패", async () => {
    await request(app)
      .get("/users")
      .set("Authorization", "Bearer invalid_token")
      .expect(401);

    await request(app)
      .get("/users/profile")
      .set("Authorization", "Bearer invalid_token")
      .expect(401);
  });

  it("404: 존재하지 않는 기사님 ID로 조회 시 실패", async () => {
    const nonExistentId = "non-existent-id";
    
    await request(app)
      .get(`/movers/${nonExistentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });
});

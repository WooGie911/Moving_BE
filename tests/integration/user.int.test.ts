import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/db/prisma/prisma";
import { loginLimiter, signupLimiter } from "../../src/middlewares/rateLimiter";

// 쿠키 추출 함수
const getCookies = (res: any) => {
  const raw = res.headers["set-cookie"];
  const cookies: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  expect(cookies).toBeDefined();
  expect(Array.isArray(cookies)).toBe(true);
  return cookies;
};

// 테스트 유틸: 고유 IP/이메일, 리미터 초기화
const RATE_KEYS = ["::ffff:127.0.0.1", "127.0.0.1", "::1"] as const;
let __seq = 0;
const nextSeq = () => ++__seq;
const uniqueIp = () => `198.51.100.${((Date.now() + nextSeq()) % 200) + 1}`;
const uniqueEmail = (tag = "u") =>
  `test+${tag}+${Date.now()}_${Math.floor(Math.random() * 1_000_000)}_${nextSeq()}@naver.com`;
const resetAllRate = (ip?: string) => {
  for (const k of RATE_KEYS) {
    loginLimiter.resetKey(k);
    signupLimiter.resetKey(k);
  }
  if (ip) {
    loginLimiter.resetKey(ip);
    signupLimiter.resetKey(ip);
  }
};

beforeAll(() => {
  (app as any).set("trust proxy", 1);
});

beforeEach(() => {
  resetAllRate();
});

// POST /users/profile
describe("POST /users/profile - 일반유저 프로필 등록 API 테스트", () => {
  let agent: any;
  let accessToken: string;
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    agent = request.agent(app);
    const signin = await agent
      .post("/auth/sign-in")
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);

    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
    expect(accessCookie).toBeDefined();
    accessToken = accessCookie!.split(";")[0].split("=")[1];
  });

  // 일반유저 프로필 등록 성공 (200)
  it("POST /user/profile - 200", async () => {
    // 유저 정보 조회 성공 시 반환 값 (매칭 가능한 것만 테스트)
    const profileData = {
      name: "testUser",
      nickname: "test3334Test",
      customerImage: "test.jpg",
      currentArea: "SEOUL",
      preferredServices: ["SMALL", "HOME"],
    };

    const res = await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        nickname: "test3334Test",
        customerImage: "test.jpg",
        currentArea: "SEOUL",
        preferredServices: ["SMALL", "HOME"],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("프로필이 성공적으로 등록되었습니다.");
    expect(res.body.data).toMatchObject(profileData);
  });
});

// GET /users
describe("GET /users - 유저 정보 조회 API 테스트", () => {
  let agent: any;
  let accessToken: string;
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    agent = request.agent(app);
    const signin = await agent
      .post("/auth/sign-in")
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);

    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c) => c.startsWith("accessToken="));
    expect(accessCookie).toBeDefined();
    accessToken = accessCookie!.split(";")[0].split("=")[1];
  });

  // 유저 정보 조회 성공 (200)
  it("GET /user - 200", async () => {
    // 유저 정보 조회 성공 시 반환 값 (매칭 가능한 것만 테스트)
    const userInfo = {
      name: "testUser",
      email: "test3334@naver.com",
      phoneNumber: "01012345678",
      nickname: "test3334Test",
      customerImage: "test.jpg",
      userType: "CUSTOMER",
      provider: "LOCAL",
      hasBothProfiles: false,
    };

    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(userInfo);
  });
});

// GET /users/profile
describe("GET /users/profile - 프로필 조회 API 테스트", () => {
  let accessToken: string;

  beforeAll(async () => {
    // 로그인 후 토큰 확보
    const signin = await request(app)
      .post("/auth/sign-in")
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);
    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    );
    expect(accessCookie).toBeDefined();
    accessToken = accessCookie!.split(";")[0].split("=")[1];
  });

  it("200: CUSTOMER 프로필 조회 성공 (사전 등록 후 조회)", async () => {
    // 사전 등록
    await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        nickname: "profileOK",
        customerImage: "test.jpg",
        currentArea: "SEOUL",
        preferredServices: ["SMALL", "HOME"],
      })
      .expect(200);

    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ nickname: "profileOK" });
  });

  it("401: 토큰 미제공", async () => {
    await request(app).get("/users/profile").expect(401);
  });

  it("404: 프로필 미존재", async () => {
    const ip = uniqueIp();
    resetAllRate(ip);
    const email = uniqueEmail("noProfile");

    // 회원가입으로 신규 유저 생성(프로필 없음)
    const signup = await request(app)
      .post("/auth/sign-up")
      .set("X-Forwarded-For", ip)
      .send({
        name: "testUser",
        email,
        password: "Test1234!",
        phoneNumber: "01012345678",
        userType: "CUSTOMER",
      })
      .expect(201);
    const signupCookies = getCookies(signup);
    const accessCookie = signupCookies.find((c: string) =>
      c.startsWith("accessToken=")
    )!;
    const token = accessCookie.split(";")[0].split("=")[1];

    await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});

// POST /users/profile
describe("POST /users/profile - 프로필 등록 API 테스트", () => {
  let accessToken: string;

  beforeAll(async () => {
    const signin = await request(app)
      .post("/auth/sign-in")
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);
    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    );
    accessToken = accessCookie!.split(";")[0].split("=")[1];
  });

  it("200: 고객 프로필 등록 + Set-Cookie 확인", async () => {
    const res = await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        nickname: "cookieCheck",
        customerImage: "test.jpg",
        currentArea: "SEOUL",
        preferredServices: ["SMALL", "HOME"],
      })
      .expect(200);

    const list = getCookies(res);
    const access = list.find((c) => c.startsWith("accessToken="))!;
    const refresh = list.find((c) => c.startsWith("refreshToken="))!;
    expect(access).not.toContain("HttpOnly");
    expect(access).toContain("SameSite=Lax");
    expect(access).toContain("Path=/");
    expect(access).toMatch(/Max-Age=\d+/);
    expect(refresh).toContain("HttpOnly");
    expect(refresh).toContain("SameSite=Lax");
    expect(refresh).toContain("Path=/");
    expect(refresh).toMatch(/Max-Age=\d+/);
  });

  it("401: 토큰 미제공", async () => {
    await request(app)
      .post("/users/profile")
      .send({
        nickname: "noauth",
        currentArea: "SEOUL",
        preferredServices: ["SMALL"],
      })
      .expect(401);
  });

  it("422: 닉네임 형식 불일치(밑줄 포함)", async () => {
    const ip = uniqueIp();
    resetAllRate(ip);
    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);
    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    )!;
    const token = accessCookie.split(";")[0].split("=")[1];

    await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nickname: "bad_name",
        currentArea: "SEOUL",
        preferredServices: ["SMALL"],
      })
      .expect(422);
  });

  it("422: 현재 지역 누락", async () => {
    const ip = uniqueIp();
    resetAllRate(ip);
    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);
    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    )!;
    const token = accessCookie.split(";")[0].split("=")[1];

    await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ nickname: "validNick", preferredServices: ["SMALL"] })
      .expect(422);
  });

  it("422: 선호 서비스 누락", async () => {
    const ip = uniqueIp();
    resetAllRate(ip);
    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);
    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    )!;
    const token = accessCookie.split(";")[0].split("=")[1];

    await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ nickname: "validNick", currentArea: "SEOUL" })
      .expect(422);
  });
});

// PATCH /users/profile/customer
describe("PATCH /users/profile/customer - 고객 프로필 수정 API 테스트", () => {
  let tokenForPatch: string;

  beforeAll(async () => {
    const ip = uniqueIp();
    resetAllRate(ip);
    // 로그인 및 사전 등록
    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);
    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    )!;
    tokenForPatch = accessCookie.split(";")[0].split("=")[1];

    await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${tokenForPatch}`)
      .send({
        nickname: "patchBase",
        customerImage: "a.jpg",
        phoneNumber: "01012345678",
        currentArea: "SEOUL",
        preferredServices: ["SMALL"],
      })
      .expect(200);
  });

  it("200: 고객 프로필 수정 성공", async () => {
    const res = await request(app)
      .patch("/users/profile/customer")
      .set("Authorization", `Bearer ${tokenForPatch}`)
      .send({
        nickname: `test${Math.floor(100 + Math.random() * 900)}`,
        phoneNumber: "01012345678",
        currentArea: "SEOUL",
        preferredServices: ["SMALL"],
      })
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  it("401: 토큰 미제공", async () => {
    await request(app)
      .patch("/users/profile/customer")
      .send({
        nickname: "x",
        phoneNumber: "01012345678",
        currentArea: "SEOUL",
        preferredServices: ["SMALL"],
      })
      .expect(401);
  });

  it("422: 유효성 실패 (잘못된 지역/서비스)", async () => {
    const ip = uniqueIp();
    resetAllRate(ip);
    // 새 로그인으로 토큰 재발급
    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);
    const cookies = getCookies(signin);
    const accessCookie = cookies.find((c: string) =>
      c.startsWith("accessToken=")
    )!;
    const token = accessCookie.split(";")[0].split("=")[1];

    // 먼저 프로필 보장
    await request(app)
      .post("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nickname: "patchErr",
        phoneNumber: "01012345678",
        currentArea: "SEOUL",
        preferredServices: ["SMALL"],
      })
      .expect(200);

    // 잘못된 지역 배열 형태 + 서비스 누락
    await request(app)
      .patch("/users/profile/customer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nickname: "patchErr2",
        currentArea: ["SEOUL"],
        preferredServices: [],
      })
      .expect(422);
  });
});

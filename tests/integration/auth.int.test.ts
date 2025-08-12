import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/db/prisma/prisma";
import { signupLimiter } from "../../src/middlewares/rateLimiter";
import { loginLimiter } from "../../src/middlewares/rateLimiter";
import authService from "../../src/services/auth.service";

describe("Auth integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(() => {
    // X-Forwarded-For를 req.ip로 인식하게 함
    (app as any).set("trust proxy", 1);
  });

  const resetAllRateLimits = () => {
    (loginLimiter as any).store?.resetAll?.();
    (signupLimiter as any).store?.resetAll?.();
  };

  // 공통
  const getCookies = (res: any) => {
    const raw = res.headers["set-cookie"];
    const cookies: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(cookies).toBeDefined();
    expect(Array.isArray(cookies)).toBe(true);
    return cookies;
  };

  // 1) 액세스 토큰만 검사
  const expectAccessCookieOnly = (res: any) => {
    const cookies = getCookies(res);
    const access = cookies.find((c) => c.startsWith("accessToken="));
    expect(access).toBeDefined();
    expect(access!).not.toEqual(expect.stringContaining("HttpOnly"));
    expect(access!).toEqual(expect.stringContaining("SameSite=Lax"));
    expect(access!).toEqual(expect.stringContaining("Path=/"));
    expect(access!).toEqual(expect.stringContaining("Max-Age="));
  };

  // 2) 액세스+리프레시 둘 다 검사
  const expectBothAuthCookies = (res: any) => {
    const cookies = getCookies(res);
    const access = cookies.find((c) => c.startsWith("accessToken="));
    const refresh = cookies.find((c) => c.startsWith("refreshToken="));

    // access
    expect(access).toBeDefined();
    expect(access!).not.toEqual(expect.stringContaining("HttpOnly"));
    expect(access!).toEqual(expect.stringContaining("SameSite=Lax"));
    expect(access!).toEqual(expect.stringContaining("Path=/"));
    expect(access!).toEqual(expect.stringContaining("Max-Age="));

    // refresh
    expect(refresh).toBeDefined();
    expect(refresh!).toEqual(expect.stringContaining("HttpOnly"));
    expect(refresh!).toEqual(expect.stringContaining("SameSite=Lax"));
    expect(refresh!).toEqual(expect.stringContaining("Path=/"));
    expect(refresh!).toEqual(expect.stringContaining("Max-Age="));
  };

  // 회원가입 성공 (200)
  it("POST /auth/sign-up - 201", async () => {
    const res = await request(app)
      .post("/auth/sign-up")
      .send({
        name: "testUser",
        email: "test+" + Date.now() + "@naver.com",
        password: "1rhdiddl!",
        phoneNumber: "01012345678",
        userType: "CUSTOMER",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("회원가입 성공");
    // expect(res.body.user.id).toBe(1);
    expect(res.body.user.userName).toBe("testUser");
    expect(res.body.user.userType).toBe("CUSTOMER");

    expectBothAuthCookies(res);
  });

  // 회원가입 실패 - 이메일 중복 (422)
  it("POST /auth/sign-up - 422", async () => {
    const res = await request(app).post("/auth/sign-up").send({
      email: "test3334@naver.com",
      password: "1rhdiddl!",
      userType: "CUSTOMER",
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("이미 사용 중인 이메일입니다.");
  });

  // 로그인 성공 (200)
  it("POST /auth/sign-in - 200", async () => {
    const res = await request(app).post("/auth/sign-in").send({
      email: "test3334@naver.com",
      password: "1rhdiddl!",
      userType: "CUSTOMER",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("로그인 성공");
    expect(res.body.user.userName).toBe("testUser");
    expect(res.body.user.userType).toBe("CUSTOMER");
  });

  // 로그인 실패 - 존재하지 않는 유저 (401)
  it("POST /auth/sign-in - 401", async () => {
    const res = await request(app).post("/auth/sign-in").send({
      email: "wrong@naver.com",
      password: "1rhdiddl!",
      userType: "CUSTOMER",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("존재하지 않는 유저입니다");
  });

  // 로그인 실패 - 소셜 로그인 유저 확인 (401)
  it("POST /auth/sign-in - 401", async () => {
    const res = await request(app).post("/auth/sign-in").send({
      email: "mover1@test.com",
      password: "1rhdiddl!",
      userType: "MOVER",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "소셜 로그인 유저입니다. 소셜로그인으로 로그인 해주세요"
    );
  });

  // 로그인 실패 - 비밀번호 불일치 (401)
  it("POST /auth/sign-in - 401", async () => {
    const res = await request(app).post("/auth/sign-in").send({
      email: "test3334@naver.com",
      password: "1wrongpassword!",
      userType: "CUSTOMER",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("비밀번호가 일치하지 않습니다");
  });

  // 로그아웃 성공 (200)
  it("POST /auth/logout - 200", async () => {
    // 로그인 전에 리미터 초기화 (이전 테스트 영향 차단)
    for (const key of ["::ffff:127.0.0.1", "127.0.0.1", "::1"]) {
      loginLimiter.resetKey(key);
    }
    // 1) 로그인
    const signin = await request(app)
      .post("/auth/sign-in")
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);

    // 2) Set-Cookie에서 accessToken 추출
    const raw = signin.get("Set-Cookie") as string[];
    const accessCookie = raw.find((c) => c.startsWith("accessToken="))!;
    const accessToken = accessCookie.split(";")[0].split("=")[1];

    // 3) 로그아웃 호출 (Bearer에 실어서)
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("로그아웃 성공");

    // 4) 쿠키 삭제 확인(선택)
    const cleared = res.get("Set-Cookie") || [];
    expect(cleared.join(";")).toEqual(expect.stringContaining("accessToken="));
    expect(cleared.join(";")).toEqual(expect.stringContaining("refreshToken="));
    expect(cleared.join(";")).toEqual(expect.stringContaining("Max-Age=0"));
  });

  // 로그아웃 실패 - 미인증 (401)
  it("POST /auth/logout - 401 (미인증)", async () => {
    const res = await request(app).post("/auth/logout").expect(401);
    // 미인증 메시지는 미들웨어 구현에 맞춰 검증
    expect(res.body.message).toBe("로그인이 필요합니다. 다시 로그인해 주세요.");
  });

  // 로그아웃 실패 - 잘못된 토큰 (401)
  it("POST /auth/logout - 401 (잘못된 토큰)", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", "Bearer invalid.token.here")
      .expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "유효하지 않은 로그인 정보입니다. 다시 로그인해 주세요."
    );
  });

  // 로그인 - 요청 제한 (429)
  it("POST /auth/sign-in - 429 after 6th try", async () => {
    resetAllRateLimits();
    const ip = `198.51.100.${Date.now() % 200}`; // 테스트 고유 IP
    const body = {
      email: "test3334@naver.com",
      password: "1rhdiddl!",
      userType: "CUSTOMER",
    };

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/auth/sign-in")
        .set("X-Forwarded-For", ip)
        .send(body)
        .expect(200);
    }
    await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send(body)
      .expect(429);
  });

  // 회원가입 - 요청 제한 (429)
  it("POST /auth/sign-up - 429 after 6th try", async () => {
    resetAllRateLimits();
    const ip = `203.0.113.${Date.now() % 200}`;

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/auth/sign-up")
        .set("X-Forwarded-For", ip)
        .send({
          name: "user",
          email: `rate+${Date.now()}+${i}@naver.com`,
          password: "1rhdiddl!",
          phoneNumber: "01012345678",
          userType: "CUSTOMER",
        })
        .expect((res) => expect(res.status).not.toBe(429));
    }

    await request(app)
      .post("/auth/sign-up")
      .set("X-Forwarded-For", ip)
      .send({
        name: "user",
        email: `rate+${Date.now()}+x@naver.com`,
        password: "1rhdiddl!",
        phoneNumber: "01012345678",
        userType: "CUSTOMER",
      })
      .expect(429);
  });

  // 토큰 갱신 성공(액세스 토큰만 반환) (200)
  it("POST /auth/refresh-token - 200 (access만)", async () => {
    resetAllRateLimits(); // 기존 유지

    // 테스트를 위한 고유 ip 사용
    const ip = `192.0.2.${Date.now() % 200}`;
    loginLimiter.resetKey(ip);

    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);

    const cookies = signin.get("Set-Cookie");
    const res = await request(app)
      .post("/auth/refresh-token")
      .set("X-Forwarded-For", ip)
      .set("Cookie", cookies as string[])
      .expect(200);

    expectAccessCookieOnly(res);
  });

  // 토큰 갱신 성공(리프레시 토큰 반환) (200)
  it("POST /auth/refresh-token - 200 (access+refresh)", async () => {
    resetAllRateLimits();

    // 테스트를 위한 고유 ip 사용
    const ip = `192.0.2.${(Date.now() + 1) % 200}`;
    loginLimiter.resetKey(ip);

    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);

    const cookies = signin.get("Set-Cookie");

    const spy = jest.spyOn(authService, "refresh").mockResolvedValue({
      accessToken: "mock-access",
      refreshToken: "mock-refresh",
      provider: "LOCAL" as any,
    } as unknown as Awaited<ReturnType<typeof authService.refresh>>);

    const res = await request(app)
      .post("/auth/refresh-token")
      .set("X-Forwarded-For", ip)
      .set("Cookie", cookies as string[])
      .expect(200);

    expectBothAuthCookies(res);
    spy.mockRestore();
  });

  // 토큰 갱신 실패 - 미인증 (401)
  it("POST /auth/refresh-token - 401 (미인증)", async () => {
    const res = await request(app).post("/auth/refresh-token").expect(401);
    expect(res.body.message).toBe("로그인이 필요합니다.");
  });

  // 토큰 갱신 실패 - 잘못된 토큰 (401)
  it("POST /auth/refresh-token - 401 (잘못된 토큰)", async () => {
    const res = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", "invalid.token.here")
      .expect(401);
    expect(res.body.message).toBe("로그인이 필요합니다.");
  });

  // 역할 전환 성공 - 200
  it("POST /auth/switch-role - 200", async () => {
    resetAllRateLimits();
    const ip = `198.0.2.${Date.now() % 200}`;
    loginLimiter.resetKey(ip);

    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email: "test3334@naver.com",
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);

    // Authorization 헤더용 액세스 토큰 추출
    const signinSetCookies = signin.get("Set-Cookie") as string[];
    const signinAccessCookie = signinSetCookies.find((c) =>
      c.startsWith("accessToken=")
    )!;
    const signinAccessToken = signinAccessCookie.split(";")[0].split("=")[1];

    const res = await request(app)
      .post("/auth/switch-role")
      .set("X-Forwarded-For", ip)
      .set("Authorization", `Bearer ${signinAccessToken}`)
      .set("Cookie", signin.get("Set-Cookie") as string[])
      .send({
        userType: "MOVER",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("역할 변경 성공");
    expect(res.body.oldUserType).toBe("CUSTOMER");
    expect(res.body.newUserType).toBe("MOVER");
  });

  // 역할 전환 실패 - 미인증 (401)
  it("POST /auth/switch-role - 401 (미인증)", async () => {
    const res = await request(app).post("/auth/switch-role").expect(401);
    expect(res.body.message).toBe("로그인이 필요합니다. 다시 로그인해 주세요.");
  });

  // 역할 전환 실패 - 존재하지 않는 유저 (404)
  it("POST /auth/switch-role - 404 (존재하지 않는 유저)", async () => {
    resetAllRateLimits();
    const ip = `198.0.2.${Date.now() % 200}`;
    loginLimiter.resetKey(ip);

    // 1) 테스트용 유저 생성 후 로그인
    const email = `notfound+${Date.now()}@naver.com`;
    await request(app)
      .post("/auth/sign-up")
      .set("X-Forwarded-For", ip)
      .send({
        name: "nf",
        email,
        password: "1rhdiddl!",
        phoneNumber: "01012345678",
        userType: "CUSTOMER",
      })
      .expect(201);

    const signin = await request(app)
      .post("/auth/sign-in")
      .set("X-Forwarded-For", ip)
      .send({
        email,
        password: "1rhdiddl!",
        userType: "CUSTOMER",
      })
      .expect(200);

    const cookies = signin.get("Set-Cookie") as string[];
    const accessCookie = cookies.find((c) => c.startsWith("accessToken="))!;
    const accessToken = accessCookie.split(";")[0].split("=")[1];

    // 2) 유저 삭제 → 존재하지 않는 유저 상태 만들기
    await prisma.user.delete({ where: { email } });

    // 3) 역할 전환 요청 → 404 기대
    const res = await request(app)
      .post("/auth/switch-role")
      .set("X-Forwarded-For", ip)
      .set("Cookie", cookies)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ userType: "MOVER" })
      .expect(404);

    expect(res.body.message).toBe("존재하지 않는 유저입니다");
  });
});

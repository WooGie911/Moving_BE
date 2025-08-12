import { errorHandler, notFoundHandler } from "./errorMiddleware";

jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));

function buildReqRes() {
  const req: any = { url: "/x", method: "GET", body: {}, query: {}, params: {}, user: { id: "u1" } };
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe("errorMiddleware", () => {
  it("notFoundHandler는 404 에러를 next로 전달", () => {
    const { req, res, next } = buildReqRes();
    notFoundHandler(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(404);
  });

  it("errorHandler는 status와 메시지를 포함한 JSON 응답을 반환", () => {
    const { req, res, next } = buildReqRes();
    const err: any = new Error("boom");
    err.status = 400;
    errorHandler(err, req as any, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.objectContaining({ message: "boom", status: 400 }) }),
    );
  });

  it("errorHandler는 프로덕션/500 에러 시 메시지를 내부 서버 오류로 마스킹", () => {
    const { req, res, next } = buildReqRes();
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const err: any = new Error("stack msg");
    // status 미설정 -> 500 취급
    errorHandler(err, req as any, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.error.message).toBe("내부 서버 오류가 발생했습니다.");
    process.env.NODE_ENV = prev;
  });

  it("errorHandler는 프로덕션/비-500 에러 시 원본 메시지 노출", () => {
    const { req, res, next } = buildReqRes();
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const err: any = new Error("bad request");
    err.status = 400;
    errorHandler(err, req as any, res as any, next as any);
    const body = res.json.mock.calls[0][0];
    expect(body.error.message).toBe("bad request");
    process.env.NODE_ENV = prev;
  });
});

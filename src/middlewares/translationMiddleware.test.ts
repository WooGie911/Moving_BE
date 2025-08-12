import { translationService } from "../services/translation.service";
import {
  translationMiddleware,
  createCustomTranslationMiddleware,
  getSupportedLanguages,
} from "./translationMiddleware";

jest.mock("../services/translation.service", () => ({
  translationService: {
    isLanguageSupported: jest.fn((lang: string) => ["en", "zh"].includes(lang)),
    translateObject: jest.fn(async (obj: any) => ({ ...obj, translated: true })),
    getSupportedLanguages: jest.fn(() => ["ko", "en", "zh"]),
  },
}));

function buildReqRes(lang?: string) {
  const req: any = {
    method: "GET",
    baseUrl: "/api",
    path: "/items",
    query: lang ? { lang } : {},
  };
  const res: any = {
    json: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("translationMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("언어가 없거나 ko이면 next()", async () => {
    // 1) 언어 없음
    let ctx = buildReqRes(undefined);
    await translationMiddleware()(ctx.req as any, ctx.res as any, ctx.next as any);
    expect(ctx.next).toHaveBeenCalledTimes(1);

    // 2) ko
    ctx = buildReqRes("ko");
    await translationMiddleware()(ctx.req as any, ctx.res as any, ctx.next as any);
    expect(ctx.next).toHaveBeenCalledTimes(1);
  });

  it("지원하지 않는 언어면 next()", async () => {
    const { req, res, next } = buildReqRes("fr");
    await translationMiddleware()(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  it("정상 번역 플로우에서 res.json 오버라이드되어 번역 결과를 반환", async () => {
    const { req, res, next } = buildReqRes("en");
    await translationMiddleware()(req as any, res as any, next as any);
    // 라우트 핸들러가 나중에 호출하는 json을 시뮬레이션
    const original = { success: true };
    // 오버라이드된 json은 Promise 체인을 내부에서 처리하고 res를 반환하므로 호출만 확인
    res.json(original);
    // 번역 서비스 호출 여부 확인
    expect(translationService.translateObject).toHaveBeenCalled();
  });

  it("shouldTranslate 옵션이 false 반환 시 next()", async () => {
    const { req, res, next } = buildReqRes("en");
    await translationMiddleware({ shouldTranslate: () => false })(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  it("createCustomTranslationMiddleware는 excludeKeys 확장", async () => {
    const mw = createCustomTranslationMiddleware(["extra"]);
    const { req, res, next } = buildReqRes("en");
    await mw(req as any, res as any, next as any);
    res.json({ ok: true });
    expect(translationService.translateObject).toHaveBeenCalled();
  });

  it("getSupportedLanguages는 서비스 값을 반환", () => {
    expect(getSupportedLanguages()).toEqual(["ko", "en", "zh"]);
  });
});

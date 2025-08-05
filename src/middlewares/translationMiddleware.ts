import { Request, Response, NextFunction } from "express";
import { translationService } from "../services/translation.service";

/**
 * 번역 미들웨어 옵션
 */
interface TranslationOptions {
  /**
   * 번역에서 제외할 키들 (기본값: id, uuid, createdAt, updatedAt, email, phone, url, link)
   */
  excludeKeys?: string[];

  /**
   * 번역을 활성화할 조건을 체크하는 함수 (선택사항)
   */
  shouldTranslate?: (req: Request) => boolean;

  /**
   * 오류 발생 시 로깅 여부 (기본값: true)
   */
  enableLogging?: boolean;
}

/**
 * DeepL을 사용한 번역 미들웨어
 *
 * 사용법:
 * 1. 쿼리 파라미터에 `lang=en` 형태로 언어 코드 전달
 * 2. 지원되는 언어: ko (한국어), zh (중국어), en (영어)
 * 3. 번역된 JSON 응답을 자동으로 반환
 *
 * 예시:
 * GET /api/users?lang=en
 * GET /api/products?lang=zh&page=1
 *
 * @param options 번역 옵션
 */
export function translationMiddleware(options: TranslationOptions = {}) {
  const {
    excludeKeys = ["id", "uuid", "createdAt", "updatedAt", "email", "phone", "url", "link", "name", "nickname"],
    shouldTranslate,
    enableLogging = true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 쿼리 파라미터에서 언어 코드 추출
      const targetLang = req.query.lang as string;

      // 번역이 필요하지 않은 경우
      if (!targetLang || targetLang === "ko" || !translationService.isLanguageSupported(targetLang)) {
        return next();
      }

      // 사용자 정의 조건 체크
      if (shouldTranslate && !shouldTranslate(req)) {
        return next();
      }

      // 원본 res.json 메서드 백업
      const originalJson = res.json.bind(res);

      // res.json 메서드 오버라이드
      res.json = function (data: any): Response<any, Record<string, any>> {
        // 번역 시작 시간 기록 (성능 모니터링용)
        const startTime = Date.now();

        // 비동기 번역 처리
        translationService
          .translateObject(data, targetLang, excludeKeys)
          .then((translatedData) => {
            // 번역 완료 시간 기록
            const translationTime = Date.now() - startTime;

            if (enableLogging) {
              console.log(`[Translation] ${req.method} ${req.path} -> ${targetLang} (${translationTime}ms)`);
            }

            // 번역된 데이터로 응답
            originalJson(translatedData);
          })
          .catch((error) => {
            if (enableLogging) {
              console.error("[Translation Error]", error);
            }

            // 번역 실패 시 원본 데이터로 응답
            originalJson(data);
          });

        return res;
      };

      next();
    } catch (error) {
      if (enableLogging) {
        console.error("[Translation Middleware Error]", error);
      }

      // 미들웨어 오류 시에도 정상적으로 진행
      next();
    }
  };
}

/**
 * 기본 번역 미들웨어 (옵션 없음)
 */
export const defaultTranslationMiddleware = translationMiddleware();

/**
 * 특정 키들을 추가로 제외하는 번역 미들웨어
 */
export function createCustomTranslationMiddleware(additionalExcludeKeys: string[] = []) {
  const defaultExcludeKeys = [
    "id",
    "uuid",
    "createdAt",
    "updatedAt",
    "email",
    "phone",
    "url",
    "link",
    "name",
    "nickname",
  ];

  return translationMiddleware({
    excludeKeys: [...defaultExcludeKeys, ...additionalExcludeKeys],
  });
}

/**
 * 인증된 사용자만 번역하는 미들웨어
 */
export const authUserTranslationMiddleware = translationMiddleware({
  shouldTranslate: (req) => {
    // 인증 여부 확인 (예: JWT 토큰 존재 여부)
    return !!(req.headers.authorization || req.cookies.token);
  },
});

/**
 * 지원되는 언어 목록을 반환하는 헬퍼 함수
 */
export function getSupportedLanguages(): string[] {
  return translationService.getSupportedLanguages();
}

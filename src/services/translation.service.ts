import * as deepl from "deepl-node";

export class TranslationService {
  private translator: deepl.Translator;
  private translationCache: Map<string, string> = new Map();

  constructor() {
    const authKey = process.env.DEEPL_AUTH_KEY;
    if (!authKey) {
      throw new Error("DEEPL_AUTH_KEY가 환경변수에 설정되지 않았습니다.");
    }
    this.translator = new deepl.Translator(authKey);
  }

  /**
   * 지원되는 언어 코드들
   */
  private readonly supportedLanguages = {
    ko: "ko", // 한국어
    zh: "zh", // 중국어
    en: "en-US", // 영어
  } as const;

  /**
   * 언어 코드가 지원되는지 확인
   */
  isLanguageSupported(langCode: string): boolean {
    return langCode in this.supportedLanguages;
  }

  /**
   * 지원되는 언어 목록 반환
   */
  getSupportedLanguages(): string[] {
    return Object.keys(this.supportedLanguages);
  }

  /**
   * 텍스트를 지정된 언어로 번역
   * @param text 번역할 텍스트
   * @param targetLang 대상 언어 코드
   * @param sourceLang 원본 언어 코드 (선택사항)
   */
  async translateText(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<string> {
    try {
      if (!this.isLanguageSupported(targetLang)) {
        throw new Error(`지원되지 않는 언어 코드입니다: ${targetLang}`);
      }

      // 캐시 키 생성
      const cacheKey = `${text}:${targetLang}:${sourceLang || "auto"}`;

      // 캐시된 번역이 있는지 확인
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey)!;
      }

      const targetLanguage =
        this.supportedLanguages[
          targetLang as keyof typeof this.supportedLanguages
        ];

      const result = await this.translator.translateText(
        text,
        (sourceLang as deepl.SourceLanguageCode) || null,
        targetLanguage
      );

      // 번역 결과를 캐시에 저장
      this.translationCache.set(cacheKey, result.text);

      return result.text;
    } catch (error) {
      console.error("번역 오류:", error);
      // 번역 실패 시 원본 텍스트 반환
      return text;
    }
  }

  /**
   * JSON 객체의 모든 문자열 값을 재귀적으로 번역
   * @param obj 번역할 JSON 객체
   * @param targetLang 대상 언어 코드
   * @param excludeKeys 번역에서 제외할 키들 (ID, 날짜 등)
   */
  async translateObject(
    obj: any,
    targetLang: string,
    excludeKeys: string[] = [
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
    ]
  ): Promise<any> {
    if (!this.isLanguageSupported(targetLang)) {
      return obj; // 지원되지 않는 언어면 원본 반환
    }

    return this.recursiveTranslate(obj, targetLang, excludeKeys);
  }

  /**
   * 재귀적으로 객체의 문자열 값들을 번역
   */
  private async recursiveTranslate(
    obj: any,
    targetLang: string,
    excludeKeys: string[]
  ): Promise<any> {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === "string") {
      // 빈 문자열이거나 숫자만 있는 경우 번역하지 않음
      if (!obj.trim() || /^\d+$/.test(obj)) {
        return obj;
      }

      return this.translateText(obj, targetLang);
    }

    if (Array.isArray(obj)) {
      const translatedArray = [];
      for (const item of obj) {
        translatedArray.push(
          await this.recursiveTranslate(item, targetLang, excludeKeys)
        );
      }
      return translatedArray;
    }

    if (typeof obj === "object") {
      const translatedObj: any = {};

      for (const [key, value] of Object.entries(obj)) {
        // 제외할 키인지 확인
        if (excludeKeys.includes(key)) {
          console.log(`[Translation Debug] Excluding key: "${key}"`);
          translatedObj[key] = value;
        } else {
          console.log(`[Translation Debug] Processing key: "${key}"`);
          translatedObj[key] = await this.recursiveTranslate(
            value,
            targetLang,
            excludeKeys
          );
        }
      }

      return translatedObj;
    }

    return obj;
  }
}

// 싱글톤 인스턴스 생성
export const translationService = new TranslationService();

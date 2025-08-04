import { TranslationService } from "./translation.service";
import * as deepl from "deepl-node";

// DeepL 모킹
jest.mock("deepl-node", () => ({
  Translator: jest.fn().mockImplementation(() => ({
    translateText: jest.fn(),
  })),
}));

describe("TranslationService", () => {
  let translationService: TranslationService;
  let mockTranslator: jest.Mocked<deepl.Translator>;

  beforeEach(() => {
    // 환경변수 설정
    process.env.DEEPL_AUTH_KEY = "test-auth-key";

    // 모킹된 Translator 인스턴스 가져오기
    const { Translator } = require("deepl-node");
    mockTranslator = new Translator(
      "test-auth-key"
    ) as jest.Mocked<deepl.Translator>;

    translationService = new TranslationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.DEEPL_AUTH_KEY;
  });

  describe("생성자", () => {
    it("환경변수가 없으면 에러를 던진다", () => {
      delete process.env.DEEPL_AUTH_KEY;

      expect(() => {
        new TranslationService();
      }).toThrow("DEEPL_AUTH_KEY가 환경변수에 설정되지 않았습니다.");
    });

    it("환경변수가 있으면 정상적으로 생성된다", () => {
      process.env.DEEPL_AUTH_KEY = "test-key";

      expect(() => {
        new TranslationService();
      }).not.toThrow();
    });
  });

  describe("isLanguageSupported", () => {
    it("지원되는 언어 코드를 올바르게 확인한다", () => {
      expect(translationService.isLanguageSupported("ko")).toBe(true);
      expect(translationService.isLanguageSupported("en")).toBe(true);
      expect(translationService.isLanguageSupported("zh")).toBe(true);
    });

    it("지원되지 않는 언어 코드를 올바르게 확인한다", () => {
      expect(translationService.isLanguageSupported("ja")).toBe(false);
      expect(translationService.isLanguageSupported("fr")).toBe(false);
      expect(translationService.isLanguageSupported("")).toBe(false);
    });
  });

  describe("getSupportedLanguages", () => {
    it("지원되는 언어 목록을 반환한다", () => {
      const supportedLanguages = translationService.getSupportedLanguages();

      expect(supportedLanguages).toEqual(["ko", "zh", "en"]);
    });
  });

  describe("translateText", () => {
    it("성공적으로 텍스트를 번역한다", async () => {
      const mockTranslationResult = {
        text: "Hello, how are you?",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const result = await translationService.translateText(
        "안녕하세요, 어떻게 지내세요?",
        "en"
      );

      expect(result).toBe("Hello, how are you?");
      expect(mockTranslator.translateText).toHaveBeenCalledWith(
        "안녕하세요, 어떻게 지내세요?",
        null,
        "en-US"
      );
    });

    it("원본 언어를 지정하여 번역한다", async () => {
      const mockTranslationResult = {
        text: "안녕하세요",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const result = await translationService.translateText(
        "Hello",
        "ko",
        "en"
      );

      expect(result).toBe("안녕하세요");
      expect(mockTranslator.translateText).toHaveBeenCalledWith(
        "Hello",
        "en",
        "ko"
      );
    });

    it("지원되지 않는 언어 코드로 번역 시 에러를 던진다", async () => {
      await expect(
        translationService.translateText("Hello", "ja")
      ).rejects.toThrow("지원되지 않는 언어 코드입니다: ja");
    });

    it("번역 실패 시 원본 텍스트를 반환한다", async () => {
      const originalText = "안녕하세요";
      mockTranslator.translateText.mockRejectedValue(
        new Error("Translation failed")
      );

      const result = await translationService.translateText(originalText, "en");

      expect(result).toBe(originalText);
    });

    it("캐시된 번역을 반환한다", async () => {
      const mockTranslationResult = {
        text: "Hello",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      // 첫 번째 번역
      await translationService.translateText("안녕하세요", "en");

      // 두 번째 번역 (캐시에서 반환)
      const result = await translationService.translateText("안녕하세요", "en");

      expect(result).toBe("Hello");
      // 두 번째 호출에서는 실제 번역 API가 호출되지 않아야 함
      expect(mockTranslator.translateText).toHaveBeenCalledTimes(1);
    });
  });

  describe("translateObject", () => {
    it("지원되지 않는 언어면 원본 객체를 반환한다", async () => {
      const originalObj = { message: "Hello" };

      const result = await translationService.translateObject(
        originalObj,
        "ja"
      );

      expect(result).toEqual(originalObj);
    });

    it("단순한 객체를 번역한다", async () => {
      const mockTranslationResult = {
        text: "Hello",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const originalObj = { message: "안녕하세요" };
      const result = await translationService.translateObject(
        originalObj,
        "en"
      );

      expect(result).toEqual({ message: "Hello" });
    });

    it("배열을 번역한다", async () => {
      const mockTranslationResult = {
        text: "Hello",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const originalArray = ["안녕하세요", "반갑습니다"];
      const result = await translationService.translateObject(
        originalArray,
        "en"
      );

      expect(result).toEqual(["Hello", "Hello"]);
    });

    it("중첩된 객체를 번역한다", async () => {
      const mockTranslationResult = {
        text: "Hello",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const originalObj = {
        user: {
          name: "김철수",
          greeting: "안녕하세요",
        },
        settings: {
          language: "ko",
        },
      };

      const result = await translationService.translateObject(
        originalObj,
        "en"
      );

      expect(result).toEqual({
        user: {
          name: "김철수", // name은 제외 키
          greeting: "Hello",
        },
        settings: {
          language: "ko", // language는 제외 키
        },
      });
    });

    it("제외할 키들을 번역하지 않는다", async () => {
      const originalObj = {
        id: "123",
        name: "김철수",
        message: "안녕하세요",
        email: "test@example.com",
        createdAt: "2023-01-01",
      };

      const mockTranslationResult = {
        text: "Hello",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const result = await translationService.translateObject(
        originalObj,
        "en"
      );

      expect(result).toEqual({
        id: "123",
        name: "김철수",
        message: "Hello",
        email: "test@example.com",
        createdAt: "2023-01-01",
      });
    });

    it("null과 undefined를 올바르게 처리한다", async () => {
      const originalObj = {
        message: "안녕하세요",
        nullValue: null,
        undefinedValue: undefined,
      };

      const mockTranslationResult = {
        text: "Hello",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const result = await translationService.translateObject(
        originalObj,
        "en"
      );

      expect(result).toEqual({
        message: "Hello",
        nullValue: null,
        undefinedValue: undefined,
      });
    });

    it("빈 문자열과 숫자만 있는 문자열은 번역하지 않는다", async () => {
      const originalObj = {
        emptyString: "",
        whitespaceString: "   ",
        numberString: "123",
        normalString: "안녕하세요",
      };

      const mockTranslationResult = {
        text: "Hello",
      };

      mockTranslator.translateText.mockResolvedValue(mockTranslationResult);

      const result = await translationService.translateObject(
        originalObj,
        "en"
      );

      expect(result).toEqual({
        emptyString: "",
        whitespaceString: "   ",
        numberString: "123",
        normalString: "Hello",
      });
    });
  });

  describe("싱글톤 인스턴스", () => {
    it("translationService가 싱글톤으로 동작한다", () => {
      const { translationService: service1 } = require("./translation.service");
      const { translationService: service2 } = require("./translation.service");

      expect(service1).toBe(service2);
    });
  });
});

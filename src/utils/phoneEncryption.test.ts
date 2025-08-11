import { encryptPhoneNumber, decryptPhoneNumber, maskPhoneNumber, hashPhoneNumber } from "./phoneEncryption";

describe("phoneEncryption", () => {
  const originalEnv = process.env.PHONE_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.PHONE_ENCRYPTION_KEY = "test-secret-key";
  });

  afterAll(() => {
    process.env.PHONE_ENCRYPTION_KEY = originalEnv;
  });

  it("암호화/복호화가 원문을 보존한다", () => {
    const phone = "010-1234-5678";
    const enc = encryptPhoneNumber(phone);
    expect(enc).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    const dec = decryptPhoneNumber(enc);
    expect(dec).toBe(phone);
  });

  it("PHONE_ENCRYPTION_KEY 없으면 에러", () => {
    const prev = process.env.PHONE_ENCRYPTION_KEY;
    delete (process.env as any).PHONE_ENCRYPTION_KEY;
    expect(() => encryptPhoneNumber("010-0000-0000")).toThrow("PHONE_ENCRYPTION_KEY is not set");
    process.env.PHONE_ENCRYPTION_KEY = prev;
  });

  it("마스킹 처리", () => {
    expect(maskPhoneNumber("010-1234-5678")).toBe("010-****-5678");
  });

  it("해시는 항상 동일 값", () => {
    const h1 = hashPhoneNumber("010-1111-2222");
    const h2 = hashPhoneNumber("010-1111-2222");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
});


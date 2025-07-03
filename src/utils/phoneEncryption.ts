import * as crypto from "crypto";

/**
 * 전화번호를 AES-256-CBC로 암호화합니다
 * @param phoneNumber 암호화할 전화번호
 * @returns 암호화된 전화번호 (IV:암호화된데이터 형태)
 */
export function encryptPhoneNumber(phoneNumber: string): string {
  const algorithm = "aes-256-cbc";
  const secretKey =
    process.env.PHONE_ENCRYPTION_KEY ||
    "default-secret-key-for-dev-only-change-in-prod";
  const key = crypto.scryptSync(secretKey, "salt", 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(phoneNumber, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * 암호화된 전화번호를 복호화합니다
 * @param encryptedData 암호화된 전화번호 데이터
 * @returns 복호화된 전화번호
 */
export function decryptPhoneNumber(encryptedData: string): string {
  const algorithm = "aes-256-cbc";
  const secretKey =
    process.env.PHONE_ENCRYPTION_KEY ||
    "default-secret-key-for-dev-only-change-in-prod";
  const key = crypto.scryptSync(secretKey, "salt", 32);

  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * 전화번호의 마지막 4자리만 표시하고 나머지는 마스킹합니다
 * @param phoneNumber 원본 전화번호 (예: 010-1234-5678)
 * @returns 마스킹된 전화번호 (예: 010-****-5678)
 */
export function maskPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/(\d{3})-(\d{4})-(\d{4})/, "$1-****-$3");
}

/**
 * 전화번호를 해시화합니다 (검색용)
 * @param phoneNumber 전화번호
 * @returns SHA-256 해시값
 */
export function hashPhoneNumber(phoneNumber: string): string {
  return crypto.createHash("sha256").update(phoneNumber).digest("hex");
}

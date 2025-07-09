// src/utils/validators/userValidator.ts

import { ValidationError } from "../../types/commonError";

/**
 * 허용 TLD 리스트
 * 필요에 따라 확장 가능
 */
const allowedTlds = [
  "com",
  "net",
  "org",
  "co.kr",
  "kr",
  "io",
  "dev",
  "app",
  "me",
  "edu",
  "gov",
  "us",
  "co",
  "info",
  "biz",
  "tv",
  "store",
];

/**
 * 이메일 유효성 검사
 * - 기본 이메일 구문 검사
 * - 허용된 TLD 검사
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const domain = email.split("@")[1];
  if (!domain) return false;

  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;

  const tld = domainParts.slice(-1)[0].toLowerCase();
  if (!allowedTlds.includes(tld)) return false;

  return true;
};

/**
 * 이름 유효성 검사
 * - 한글, 영문, 공백 허용
 * 최소 2자이상
 * 최대 10자 이하
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[가-힣a-zA-Z\s]{2,10}$/;
  return nameRegex.test(name);
};

/**
 * 전화번호 유효성 검사 (대한민국 기준: 010xxxxxxxx 또는 +8210xxxxxxxx)
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^(010\d{8}|(\+82)?10\d{8})$/;
  return phoneRegex.test(phoneNumber.replace(/[-\s]/g, ""));
};

/**
 * 비밀번호 유효성 검사
 * - 최소 8자 이상
 * - 영문, 숫자, 특수문자 각각 1개 이상 포함
 */
export const isValidPassword = (password: string): boolean => {
  const lengthCheck = password.length >= 8;
  const letterCheck = /[a-zA-Z]/.test(password);
  const numberCheck = /\d/.test(password);
  const specialCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return lengthCheck && letterCheck && numberCheck && specialCheck;
};

/**
 * 회원가입 입력값 유효성 검사
 */
type TUserSignupInput = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
};

/**
 * 유연한 회원가입 유효성 검사
 * - 필요한 필드만 넘기면 해당 필드만 검증
 */
export const validateUserSignupInput = (
  input: Partial<TUserSignupInput>
): void => {
  if (input.email !== undefined && !isValidEmail(input.email)) {
    throw new ValidationError(
      "올바른 이메일 형식이 아니거나 허용되지 않는 도메인입니다."
    );
  }
  if (input.name !== undefined && !isValidName(input.name)) {
    throw new ValidationError("올바른 이름 형식이 아닙니다.");
  }
  if (
    input.phoneNumber !== undefined &&
    !isValidPhoneNumber(input.phoneNumber)
  ) {
    throw new ValidationError("올바른 전화번호 형식이 아닙니다.");
  }
  if (input.password !== undefined && !isValidPassword(input.password)) {
    throw new ValidationError(
      "비밀번호는 최소 8자 이상이며 영문, 숫자, 특수문자를 각각 포함해야 합니다."
    );
  }
};

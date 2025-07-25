import { TUserRole } from "../types/user.types";

/**
 * 기존 유저 타입 배열과 새로운 유저 타입을 병합
 * @param existingUserTypes 기존 유저 타입 배열
 * @param newUserType 새로 추가할 유저 타입
 * @returns 병합된 유저 타입 배열
 */
export const mergeUserTypes = (
  existingUserTypes: TUserRole[],
  newUserType: TUserRole
): TUserRole[] => {
  // 기존 타입이 1개이고, 받아온 타입이 MOVER이고, 원본이 "CUSTOMER"만 존재하는 경우
  if (
    existingUserTypes?.[0] === "CUSTOMER" &&
    existingUserTypes.length === 1 &&
    newUserType === "MOVER"
  ) {
    return [existingUserTypes[0], newUserType]; // [CUSTOMER, MOVER]
  }

  // 기존 타입이 1개이고, 받아온 타입이 CUSTOMER이고, 원본이 "MOVER"만 존재하는 경우
  else if (
    existingUserTypes?.[0] === "MOVER" &&
    existingUserTypes.length === 1 &&
    newUserType === "CUSTOMER"
  ) {
    return [newUserType, existingUserTypes[0]]; // [CUSTOMER, MOVER]
  }

  // 그 외의 경우는 기존 배열 그대로 반환
  else {
    return existingUserTypes;
  }
};

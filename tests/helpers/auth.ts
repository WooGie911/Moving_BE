import prisma from "../../src/db/prisma/prisma";
import { signAccessToken } from "./jwt";

export async function getCustomerToken() {
  // 1) 시드 사용자 우선 탐색
  let user = await prisma.user.findFirst({ where: { userType: { has: "CUSTOMER" } } });

  // 2) 없으면 테스트용 고객 생성 (프로필 플래그 포함)
  if (!user) {
    const tsEmail = `customer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`;
    user = await prisma.user.create({
      data: {
        email: tsEmail,
        name: "통합테스트고객",
        userType: ["CUSTOMER"],
        isCustomer: true,
        preferredServices: [],
      },
    });
  }

  if (!user) throw new Error("고객 사용자 생성/조회에 실패했습니다.");
  return signAccessToken({ userId: user.id, name: user.name ?? "고객", userType: "CUSTOMER", hasProfile: true });
}

export async function getMoverToken() {
  // 1) 시드 사용자 우선 탐색
  let user = await prisma.user.findFirst({ where: { userType: { has: "MOVER" } } });

  // 2) 없으면 테스트용 기사 생성 (프로필 플래그 포함)
  if (!user) {
    const tsEmail = `mover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`;
    user = await prisma.user.create({
      data: {
        email: tsEmail,
        name: "통합테스트기사",
        userType: ["MOVER"],
        isMover: true,
        currentAreas: [],
        serviceTypes: [],
      },
    });
  }

  if (!user) throw new Error("기사 사용자 생성/조회에 실패했습니다.");
  return signAccessToken({ userId: user.id, name: user.name ?? "기사", userType: "MOVER", hasProfile: true });
}

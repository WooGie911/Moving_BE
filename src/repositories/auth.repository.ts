import { PrismaClient } from "@prisma/client";
import { TUser } from "../types/user";

const prisma = new PrismaClient();

const saveUser = async (user: TUser) => {
  return await prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      encryptedPassword: user.encryptedPassword,
      encryptedPhoneNumber: user.encryptedPhoneNumber,
      currentRole: user.currentRole,
      hasProfile: false,
    },
  });
};

// 로그인 검증용 로직
const findUserByEmailAndPassword = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      currentRole: true,
      email: true,
      encryptedPassword: true,
    },
  });
};

export default { saveUser, findUserByEmailAndPassword };

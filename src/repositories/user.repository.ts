import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      currentRole: true,
      accessToken: true,
      hasProfile: true,
    },
  });
  return user;
};

export { getUserById };

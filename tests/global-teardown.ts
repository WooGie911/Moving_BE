import prisma from "../src/db/prisma/prisma";

export default async function () {
  await prisma.$disconnect();
}

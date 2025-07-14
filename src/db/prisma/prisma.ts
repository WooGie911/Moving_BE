import { PrismaClient } from "@prisma/client";
import { reviewPrismaMiddleware } from "../../middlewares/reviewMiddleware";

const prisma = new PrismaClient();

// 리뷰생성 Prisma 미들웨어 등록
prisma.$use(reviewPrismaMiddleware);

export default prisma;

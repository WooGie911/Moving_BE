import { PrismaClient } from "@prisma/client";
import { reviewPrismaMiddleware } from "../../middlewares/reviewMiddleware";
import { notificationMiddleware } from "../../middlewares/notificationMiddleware";

const prisma = new PrismaClient();

// 리뷰생성 Prisma 미들웨어 등록
prisma.$use(reviewPrismaMiddleware);

// 알림생성 Prisma 미들웨어 등록
prisma.$use(notificationMiddleware);

export default prisma;

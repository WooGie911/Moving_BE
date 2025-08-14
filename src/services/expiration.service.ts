import prisma from "../db/prisma/prisma";

const expirationService = {
  // 만료된 견적 요청 처리
  processExpiredEstimateRequests: async () => {
    try {
      // 1. PENDING 상태에서 이사일이 지난 견적 요청들 (만료 처리)
      const expiredRequests = await prisma.estimateRequest.findMany({
        where: {
          status: "PENDING",
          moveDate: {
            lt: new Date(), // 현재 시간보다 이전
          },
          deletedAt: null,
        },
        select: {
          id: true,
          moveDate: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      });

      let totalProcessed = 0;

      // PENDING → EXPIRED 처리
      if (expiredRequests.length > 0) {
        for (const request of expiredRequests) {
          await prisma.$transaction(async (tx) => {
            // 견적 요청 상태를 EXPIRED로 변경
            await tx.estimateRequest.update({
              where: { id: request.id },
              data: { status: "EXPIRED" },
            });

            // 해당 견적 요청의 PROPOSED 상태 견적들을 AUTO_REJECTED로 변경
            const updatedEstimates = await tx.estimate.updateMany({
              where: {
                estimateRequestId: request.id,
                status: "PROPOSED",
                deletedAt: null,
              },
              data: { status: "AUTO_REJECTED" },
            });
          });
        }
        totalProcessed += expiredRequests.length;
      }

      // 2. 견적 요청이 삭제된 orphaned estimates 처리
      const orphanedEstimates = await prisma.estimate.findMany({
        where: {
          status: "PROPOSED",
          deletedAt: null,
          estimateRequest: {
            OR: [
              { deletedAt: { not: null } }, // 소프트 삭제된 견적 요청
              { status: "CANCELLED" }, // 취소된 견적 요청
            ],
          },
        },
        select: {
          id: true,
          estimateRequestId: true,
          estimateRequest: {
            select: {
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      let orphanedCount = 0;
      if (orphanedEstimates.length > 0) {
        const orphanedEstimateIds = orphanedEstimates.map((e) => e.id);

        const updatedOrphanedEstimates = await prisma.estimate.updateMany({
          where: {
            id: { in: orphanedEstimateIds },
          },
          data: { status: "AUTO_REJECTED" },
        });

        orphanedCount = updatedOrphanedEstimates.count;
      }

      if (totalProcessed === 0 && orphanedCount === 0) {
        return;
      }

      return {
        processedRequests: totalProcessed,
        expiredRequests: expiredRequests.length,
        orphanedEstimates: orphanedCount,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("❌ 만료된 견적 요청 처리 중 오류 발생:", error);
      throw error;
    }
  },

  // 수동 실행용 (테스트 목적)
  manualProcessExpiredRequests: async () => {
    return await expirationService.processExpiredEstimateRequests();
  },
};

export default expirationService;

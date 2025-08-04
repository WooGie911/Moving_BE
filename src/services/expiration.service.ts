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

            console.log(
              `🔄 [만료] 견적 요청 ${request.id} (${request.customer.name}님, 이사일: ${request.moveDate.toLocaleDateString()}) - 견적 ${updatedEstimates.count}개를 AUTO_REJECTED로 변경`,
            );
          });
        }
        totalProcessed += expiredRequests.length;
      }

      // // 2. APPROVED 상태에서 이사일이 지난 견적 요청들 (완료 처리)
      // const completedRequests = await prisma.estimateRequest.findMany({
      //   where: {
      //     status: "APPROVED",
      //     moveDate: {
      //       lt: new Date(), // 현재 시간보다 이전
      //     },
      //     deletedAt: null,
      //   },
      //   select: {
      //     id: true,
      //     moveDate: true,
      //     customer: {
      //       select: {
      //         name: true,
      //       },
      //     },
      //   },
      // });
      // // APPROVED → COMPLETED 처리
      // if (completedRequests.length > 0) {
      //   for (const request of completedRequests) {
      //     await prisma.$transaction(async (tx) => {
      //       // 견적 요청 상태를 COMPLETED로 변경
      //       await tx.estimateRequest.update({
      //         where: { id: request.id },
      //         data: { status: "COMPLETED" },
      //       });

      //       // 해당 견적 요청의 ACCEPTED 상태 견적을 찾아서 기사님의 workedCount 증가
      //       const acceptedEstimate = await tx.estimate.findFirst({
      //         where: {
      //           estimateRequestId: request.id,
      //           status: "ACCEPTED",
      //           deletedAt: null,
      //         },
      //         select: {
      //           moverId: true,
      //           mover: {
      //             select: {
      //               name: true,
      //               workedCount: true,
      //             },
      //           },
      //         },
      //       });

      //       if (acceptedEstimate) {
      //         const newWorkedCount =
      //           (acceptedEstimate.mover.workedCount || 0) + 1;
      //         const isVeteran = newWorkedCount >= 10;

      //         // 기사님의 workedCount 증가 및 베테랑 여부 업데이트
      //         await tx.user.update({
      //           where: { id: acceptedEstimate.moverId },
      //           data: {
      //             workedCount: newWorkedCount,
      //             isVeteran: isVeteran,
      //           },
      //         });

      //         console.log(
      //           `✅ [완료] 견적 요청 ${request.id} (${request.customer.name}님, 이사일: ${request.moveDate.toLocaleDateString()}) - 이사 완료 처리`
      //         );
      //         console.log(
      //           `👨‍💼 기사님 ${acceptedEstimate.mover.name} workedCount: ${acceptedEstimate.mover.workedCount} → ${newWorkedCount}${isVeteran ? " (베테랑 달성!)" : ""}`
      //         );
      //       }
      //     });
      //   }
      //   totalProcessed += completedRequests.length;
      // }

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
        console.log(`🧹 [정리] 삭제/취소된 견적 요청의 orphaned 견적 ${orphanedCount}개를 AUTO_REJECTED로 변경`);
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
    console.log("🔧 수동으로 만료된 견적 요청 처리를 실행합니다...");
    return await expirationService.processExpiredEstimateRequests();
  },
};

export default expirationService;

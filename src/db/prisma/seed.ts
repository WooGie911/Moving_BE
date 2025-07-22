import {
  PrismaClient,
  UserType,
  AuthProvider,
  MoveType,
  RequestStatus,
  EstimateStatus,
  AddressRole,
  RegionType,
  NotificationType,
  ActionType,
} from "@prisma/client";
import { encryptPhoneNumber } from "../../utils/phoneEncryption";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🌱 Starting seed...");

  // 기존 데이터 삭제
  await prisma.notification.deleteMany();
  await prisma.action.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.designatedMover.deleteMany();
  await prisma.estimateRequest.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.moverServiceArea.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // 주소 데이터 생성 (10개)
  const addressData = Array.from({ length: 10 }).map((_, i) => ({
    postalCode: `1000${i}`,
    city: i % 2 === 0 ? "강남구" : "서초구",
    district: i % 2 === 0 ? `역삼동${i}` : `서초동${i}`,
    detail: `테스트로 ${i * 10}`,
    region: i % 2 === 0 ? RegionType.SEOUL : RegionType.GYEONGGI,
  }));
  const addresses = await Promise.all(
    addressData.map((data) => prisma.address.create({ data }))
  );

  // 유저 20명 생성 (고객 15, 기사 5, 하이브리드 2)
  const userArr: any[] = [];
  for (let i = 1; i <= 15; i++) {
    userArr.push({
      email: `customer${i}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(
        `010-1${i.toString().padStart(3, "0")}-0000`
      ),
      name: `고객${i}`,
      userType: [UserType.CUSTOMER],
      provider: AuthProvider.LOCAL,
      customerImage: `https://example.com/customer${i}.jpg`,
      nickname: `고객닉${i}`,
      currentArea: getRandom([RegionType.SEOUL, RegionType.GYEONGGI]),
      preferredServices: [
        getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
      ],
      totalFavoriteCount: 0,
    });
  }
  for (let i = 1; i <= 5; i++) {
    userArr.push({
      email: `mover${i}@test.com`,
      encryptedPassword: await bcrypt.hash(`Mover!Pass${i}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(
        `010-2${i.toString().padStart(3, "0")}-0000`
      ),
      name: `기사${i}`,
      userType: [UserType.MOVER],
      provider: AuthProvider.LOCAL,
      moverImage: `https://example.com/mover${i}.jpg`,
      nickname: `기사닉${i}`,
      currentAreas: [getRandom([RegionType.SEOUL, RegionType.GYEONGGI])],
      isVeteran: i % 2 === 0,
      shortIntro: `경력 ${i}년의 기사`,
      detailIntro: `이사 전문 기사${i}입니다`,
      career: i,
      workedCount: i * 10,
      averageRating: 4 + (i % 2) * 0.5,
      totalReviewCount: i * 5,
      serviceTypes: [
        getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
      ],
      totalFavoriteCount: 0,
    });
  }
  // 하이브리드 2명
  for (let i = 1; i <= 2; i++) {
    userArr.push({
      email: `hybrid${i}@test.com`,
      encryptedPassword: await bcrypt.hash(`Hybrid!Pass${i}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(
        `010-3${i.toString().padStart(3, "0")}-0000`
      ),
      name: `하이브리드${i}`,
      userType: [UserType.CUSTOMER, UserType.MOVER],
      provider: AuthProvider.LOCAL,
      customerImage: `https://example.com/hybrid${i}_customer.jpg`,
      moverImage: `https://example.com/hybrid${i}_mover.jpg`,
      nickname: `하이브리드닉${i}`,
      currentAreas: [RegionType.SEOUL, RegionType.GYEONGGI],
      isVeteran: true,
      shortIntro: `고객+기사 하이브리드${i}`,
      detailIntro: `고객과 기사 모두 경험한 하이브리드${i}`,
      career: 3 + i,
      workedCount: 20 * i,
      averageRating: 4.7,
      totalReviewCount: 10 * i,
      serviceTypes: [MoveType.HOME, MoveType.SMALL],
      totalFavoriteCount: 0,
    });
  }
  const users = await Promise.all(
    userArr.map((data) => prisma.user.create({ data }))
  );

  // 기사님 서비스 지역 (기사/하이브리드)
  const moverUsers = users.filter((u) => u.userType.includes("MOVER"));
  await Promise.all(
    moverUsers.map((u, idx) =>
      prisma.moverServiceArea.create({
        data: {
          userId: u.id,
          region: getRandom([RegionType.SEOUL, RegionType.GYEONGGI]),
          district: idx % 2 === 0 ? "강남구" : "서초구",
        },
      })
    )
  );

  // 사용자별 주소 등록 (각 유저마다 2개씩)
  await Promise.all(
    users.map((u, idx) =>
      Promise.all([
        prisma.userAddress.create({
          data: {
            userId: u.id,
            addressId: addresses[idx % addresses.length].id,
            role: AddressRole.FROM,
            customLabel: "집/회사",
          },
        }),
        prisma.userAddress.create({
          data: {
            userId: u.id,
            addressId: addresses[(idx + 1) % addresses.length].id,
            role: AddressRole.TO,
            customLabel: "이사갈 곳",
          },
        }),
      ])
    )
  );

  // 견적 요청 30개 생성
  const estimateRequests = await Promise.all(
    Array.from({ length: 30 }).map((_, i) =>
      prisma.estimateRequest.create({
        data: {
          customerId: users[i % 15].id, // 고객 15명 중에서
          moveType: getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
          moveDate: new Date(Date.now() + i * 86400000),
          fromAddressId: addresses[i % addresses.length].id,
          toAddressId: addresses[(i + 1) % addresses.length].id,
          status: getRandom([
            RequestStatus.PENDING,
            RequestStatus.APPROVED,
            RequestStatus.COMPLETED,
            RequestStatus.REJECTED,
            RequestStatus.CANCELLED,
            RequestStatus.EXPIRED,
          ]),
          description: `테스트 견적 요청 ${i + 1}`,
        },
      })
    )
  );

  // 견적 30개 생성 (기사/하이브리드가 랜덤하게 제출)
  const estimates = await Promise.all(
    Array.from({ length: 30 }).map((_, i) =>
      prisma.estimate.create({
        data: {
          moverId: moverUsers[i % moverUsers.length].id,
          estimateRequestId: estimateRequests[i % estimateRequests.length].id,
          price: 100000 + i * 10000,
          comment: `테스트 견적 코멘트 ${i + 1}`,
          status: getRandom([
            EstimateStatus.PROPOSED,
            EstimateStatus.ACCEPTED,
            EstimateStatus.REJECTED,
            EstimateStatus.AUTO_REJECTED,
          ]),
          workingHours: `${2 + (i % 5)}- ${4 + (i % 5)}시간`,
          includesPackaging: i % 2 === 0,
          insuranceAmount: 1000000 + i * 100000,
        },
      })
    )
  );

  // 찜 40개 생성
  const favoriteArr = [];
  for (let i = 0; i < 40; i++) {
    const customer = users[i % 15];
    const mover = moverUsers[i % moverUsers.length];
    favoriteArr.push(
      prisma.favorite.create({
        data: {
          customerId: customer.id,
          moverId: mover.id,
        },
      })
    );
    // 기사/하이브리드의 totalFavoriteCount 증가
    await prisma.user.update({
      where: { id: mover.id },
      data: { totalFavoriteCount: { increment: 1 } },
    });
  }
  await Promise.all(favoriteArr);

  // 리뷰 10개 생성
  await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.review.create({
        data: {
          customerId: users[i % 15].id,
          moverId: moverUsers[i % moverUsers.length].id,
          estimateRequestId: estimateRequests[i % estimateRequests.length].id,
          rating: 3 + (i % 3),
          content: `테스트 리뷰 내용 ${i + 1}`,
        },
      })
    )
  );

  // 사용자 활동 15개 생성
  const actions = await Promise.all(
    Array.from({ length: 15 }).map((_, i) =>
      prisma.action.create({
        data: {
          userId: users[i].id,
          type: getRandom([
            ActionType.ESTIMATE_REQUEST_CREATE,
            ActionType.ESTIMATE_SUBMITTED,
            ActionType.ESTIMATE_ACCEPTED,
            ActionType.ESTIMATE_REJECTED,
            ActionType.REVIEW_SUBMITTED,
          ]),
          entityId: estimateRequests[i % estimateRequests.length].id,
          entityType: "EstimateRequest",
          description: `테스트 활동 ${i + 1}`,
        },
      })
    )
  );

  // 알림 15개 생성
  await Promise.all(
    Array.from({ length: 15 }).map((_, i) =>
      prisma.notification.create({
        data: {
          actionId: actions[i].id,
          userId: users[i].id,
          type: getRandom([
            NotificationType.ESTIMATE_ARRIVED,
            NotificationType.ESTIMATE_STATUS_UPDATED,
            NotificationType.REVIEW_EVENT,
            NotificationType.FAVORITE_EVENT,
            NotificationType.MOVE_DAY_REMINDER,
          ]),
          title: `테스트 알림 제목 ${i + 1}`,
          content: `테스트 알림 내용 ${i + 1}`,
          path: `/test/${i + 1}`,
        },
      })
    )
  );

  console.log("✅ Seed completed successfully!");
  console.log(`👤 Created ${users.length} users (고객/기사/하이브리드)`);
  console.log(`🏠 Created ${addresses.length} addresses`);
  console.log(`📋 Created ${estimateRequests.length} estimate requests`);
  console.log(`💰 Created ${estimates.length} estimates`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

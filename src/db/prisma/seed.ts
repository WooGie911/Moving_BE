import {
  PrismaClient,
  UserType,
  AuthProvider,
  MoveType,
  RequestStatus,
  EstimateStatus,
  AddressRole,
  RegionType,
  ReviewStatus,
} from "@prisma/client";
import { encryptPhoneNumber } from "../../utils/phoneEncryption";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadJsonData(filename: string): any {
  const filePath = path.join(__dirname, "seed-data", filename);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}

async function main() {
  console.log("🌱 Starting seed...");

  // DB 초기화
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

  // 데이터 로드
  const addressData = loadJsonData("addresses.json").slice(0, 30);
  const userData = loadJsonData("users.json");
  const reviewTemplates = loadJsonData("review-templates.json");

  // 주소 생성
  const regionMapping: { [key: string]: RegionType } = {
    서울: RegionType.SEOUL,
    부산: RegionType.BUSAN,
    대구: RegionType.DAEGU,
    인천: RegionType.INCHEON,
    광주: RegionType.GWANGJU,
    대전: RegionType.DAEJEON,
    울산: RegionType.ULSAN,
    세종: RegionType.SEJONG,
    경기: RegionType.GYEONGGI,
    강원: RegionType.GANGWON,
    충북: RegionType.CHUNGBUK,
    충남: RegionType.CHUNGNAM,
    전북: RegionType.JEONBUK,
    전남: RegionType.JEONNAM,
    경북: RegionType.GYEONGBUK,
    경남: RegionType.GYEONGNAM,
    제주: RegionType.JEJU,
  };
  const addressDataForCreate = addressData.map((data: any) => ({
    zoneCode: data.zoneCode,
    city: data.city,
    district: data.district,
    detail: data.detail,
    region: regionMapping[data.region],
  }));
  await prisma.address.createMany({ data: addressDataForCreate });
  const addresses = await prisma.address.findMany();

  // 고객/기사 30명씩 생성
  const customerNames = userData.customers.slice(0, 30);
  const moverNames = userData.movers.slice(0, 30);
  const userArr = [];
  for (let i = 0; i < 30; i++) {
    userArr.push({
      email: `customer${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 1}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${1000 + i}-${1000 + i}`),
      name: customerNames[i],
      userType: [UserType.CUSTOMER],
      provider: AuthProvider.LOCAL,
      nickname: `customer_${i + 1}`,
      customerImage: "",
      moverImage: "",
      currentArea: getRandom([
        RegionType.SEOUL,
        RegionType.GYEONGGI,
        RegionType.BUSAN,
        RegionType.DAEGU,
        RegionType.INCHEON,
      ]),
      preferredServices: [getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE])],
      shortIntro: null,
      detailIntro: null,
      career: null,
      isVeteran: null,
      workedCount: null,
      averageRating: null,
      totalReviewCount: null,
      currentAreas: [],
      serviceTypes: [],
      totalFavoriteCount: 0,
    });
    userArr.push({
      email: `mover${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 31}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${2000 + i}-${2000 + i}`),
      name: moverNames[i],
      userType: [UserType.MOVER],
      provider: AuthProvider.LOCAL,
      nickname: `mover_${i + 1}`,
      customerImage: "",
      moverImage: "",
      currentArea: null,
      preferredServices: [],
      shortIntro: `${moverNames[i]}은(는) ${3 + (i % 15)}년 경력의 친절하고 꼼꼼한 기사입니다!`,
      detailIntro: `${moverNames[i]}은(는) ${3 + (i % 15)}년간 다양한 이사 경험을 바탕으로 최고의 서비스를 제공합니다. 안전하고 신속한 이사를 약속드립니다.`,
      career: 3 + (i % 15),
      isVeteran: 3 + (i % 15) >= 10,
      workedCount: Math.floor((3 + (i % 15)) * 2.5) + (i % 20),
      averageRating: 0,
      totalReviewCount: 0,
      currentAreas: [
        getRandom([RegionType.SEOUL, RegionType.GYEONGGI, RegionType.BUSAN, RegionType.DAEGU, RegionType.INCHEON]),
      ],
      serviceTypes: [getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE])],
      totalFavoriteCount: 0,
    });
  }
  await prisma.user.createMany({ data: userArr });
  const users = await prisma.user.findMany();

  // 기사님 서비스 지역 (기사 30명)
  const moverUsers = users.filter((u) => u.userType.includes(UserType.MOVER)).slice(0, 30);
  const serviceAreaData = moverUsers.map((u, idx) => ({
    userId: u.id,
    region: getRandom([RegionType.SEOUL, RegionType.GYEONGGI, RegionType.BUSAN, RegionType.DAEGU, RegionType.INCHEON]),
    district: idx % 2 === 0 ? "강남구" : "서초구",
  }));
  await prisma.moverServiceArea.createMany({ data: serviceAreaData });

  // 사용자별 주소 등록 (각 유저마다 1개씩만 FROM)
  const userAddressData = users.map((u, idx) => ({
    userId: u.id,
    addressId: addresses[idx % addresses.length].id,
    role: AddressRole.FROM,
    customLabel: "집/회사",
  }));
  await prisma.userAddress.createMany({ data: userAddressData });

  // 견적 요청 생성 (고객 30명)
  const customerUsers = users.filter((u) => u.userType.includes(UserType.CUSTOMER)).slice(0, 30);
  const estimateRequests = [];

  for (let i = 0; i < 30; i++) {
    const customer = customerUsers[i];

    // 진행중인 견적 요청 1개 (PENDING 상태)
    const pendingMoveDate = new Date(2025, 6, 28 + (i % 10)); // 2025년 7월 28일 ~ 8월 7일
    estimateRequests.push(
      prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          moveType: getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
          moveDate: pendingMoveDate,
          fromAddressId: addresses[i % addresses.length].id,
          toAddressId: addresses[(i + 1) % addresses.length].id,
          status: RequestStatus.PENDING,
          description: `${customer.name}님의 진행중인 견적 요청`,
        },
      }),
    );

    // 완료된 견적 요청 4개씩 (COMPLETED 상태)
    for (let j = 0; j < 4; j++) {
      const completedMoveDate = new Date(2024, 4, 22 + ((i * 4 + j) % 62)); // 5월 22일 ~ 7월 22일
      estimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: customer.id,
            moveType: getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
            moveDate: completedMoveDate,
            fromAddressId: addresses[(i + j) % addresses.length].id,
            toAddressId: addresses[(i + j + 1) % addresses.length].id,
            status: RequestStatus.COMPLETED,
            description: `${customer.name}님의 완료된 견적 요청 ${j + 1}`,
          },
        }),
      );
    }
  }

  const estimateRequestsResult = await Promise.all(estimateRequests);

  // 견적 생성
  const estimates = [];
  let estimateCount = 0;

  for (let i = 0; i < 30; i++) {
    const availableMovers = moverUsers.filter((_, idx) => idx !== i); // 본인 제외한 기사들

    // 대기중인 견적 요청들에 대한 견적들 (4개씩, 모두 PROPOSED 상태)
    const pendingEstimateRequest = estimateRequestsResult[i * 5]; // 대기중인 견적 (첫 번째)
    for (let l = 0; l < 4; l++) {
      const mover = availableMovers[l % availableMovers.length];

      estimates.push(
        prisma.estimate.create({
          data: {
            moverId: mover.id,
            estimateRequestId: pendingEstimateRequest.id,
            price: Math.floor((150000 + Math.floor(Math.random() * 450000)) / 5000) * 5000, // 15만원 ~ 60만원 (5000원 단위)
            comment: `${mover.name}님의 견적 코멘트`,
            status: EstimateStatus.PROPOSED,
            workingHours: `${2 + (estimateCount % 5)}- ${4 + (estimateCount % 5)}시간`,
            includesPackaging: estimateCount % 2 === 0,
            insuranceAmount: 1000000 + estimateCount * 100000,
          },
        }),
      );
      estimateCount++;
    }

    // 완료된 견적 요청들에 대한 견적들 (4개씩, 하나는 ACCEPTED, 나머지는 AUTO_REJECTED)
    for (let k = 0; k < 4; k++) {
      const completedEstimateRequest = estimateRequestsResult[i * 5 + 1 + k]; // 완료된 견적들

      for (let l = 0; l < 4; l++) {
        const mover = availableMovers[l % availableMovers.length];
        const isFirstEstimate = l === 0; // 첫 번째 견적인지 확인

        estimates.push(
          prisma.estimate.create({
            data: {
              moverId: mover.id,
              estimateRequestId: completedEstimateRequest.id,
              price: Math.floor((150000 + Math.floor(Math.random() * 450000)) / 5000) * 5000, // 15만원 ~ 60만원 (5000원 단위)
              comment: `${mover.name}님의 견적 코멘트`,
              status: isFirstEstimate ? EstimateStatus.ACCEPTED : EstimateStatus.AUTO_REJECTED,
              workingHours: `${2 + (estimateCount % 5)}- ${4 + (estimateCount % 5)}시간`,
              includesPackaging: estimateCount % 2 === 0,
              insuranceAmount: 1000000 + estimateCount * 100000,
            },
          }),
        );
        estimateCount++;
      }
    }
  }

  const estimatesResult = await Promise.all(estimates);

  // 리뷰 생성 (완료된 견적에서 확정된 것들에 대해)
  const reviews = [];

  for (let i = 0; i < 30; i++) {
    const customer = customerUsers[i];

    // 완료된 견적들에 대해 리뷰 생성
    for (let k = 0; k < 4; k++) {
      const completedEstimateRequest = estimateRequestsResult[i * 5 + 1 + k];

      // 해당 견적 요청에서 수락된 견적을 찾기
      const acceptedEstimate = estimatesResult.find(
        (estimate) =>
          estimate.estimateRequestId === completedEstimateRequest.id && estimate.status === EstimateStatus.ACCEPTED,
      );

      if (acceptedEstimate) {
        // 수락된 견적의 기사에게 리뷰 작성
        reviews.push(
          prisma.review.create({
            data: {
              customerId: customer.id,
              moverId: acceptedEstimate.moverId,
              estimateRequestId: completedEstimateRequest.id,
              rating: 3 + Math.floor(Math.random() * 3), // 3~5점 랜덤
              content: getRandom(reviewTemplates.positive) as string,
              status: ReviewStatus.COMPLETED,
            },
          }),
        );
      }
    }
  }

  const reviewsResult = await Promise.all(reviews);

  // 리뷰 통계 업데이트
  const moverStats: { [key: string]: { reviewCount: number; totalRating: number; workedCount: number } } = {};

  // 리뷰 데이터로 통계 계산
  for (const review of reviewsResult) {
    const moverId = review.moverId;
    if (!moverStats[moverId]) {
      moverStats[moverId] = { reviewCount: 0, totalRating: 0, workedCount: 0 };
    }
    moverStats[moverId].reviewCount++;
    moverStats[moverId].totalRating += review.rating;
  }

  // 확정된 견적 수 계산 (ACCEPTED 상태인 견적들)
  for (const estimate of estimatesResult) {
    if (estimate.status === EstimateStatus.ACCEPTED) {
      const moverId = estimate.moverId;
      if (!moverStats[moverId]) {
        moverStats[moverId] = { reviewCount: 0, totalRating: 0, workedCount: 0 };
      }
      moverStats[moverId].workedCount++;
    }
  }

  // 각 기사의 통계 업데이트
  for (const [moverId, stats] of Object.entries(moverStats)) {
    await prisma.user.update({
      where: { id: moverId },
      data: {
        totalReviewCount: stats.reviewCount,
        averageRating: stats.reviewCount > 0 ? stats.totalRating / stats.reviewCount : 0,
        workedCount: stats.workedCount,
      },
    });
  }

  // 찜 생성 (고객 30명 -> 기사 30명)
  const favoriteData = customerUsers.map((u, idx) => ({
    customerId: u.id,
    moverId: moverUsers[idx % moverUsers.length].id,
  }));
  await prisma.favorite.createMany({ data: favoriteData });

  // 찜 통계 업데이트
  const favorites = await prisma.favorite.findMany();
  const favoriteCounts: { [key: string]: number } = {};

  for (const favorite of favorites) {
    const moverId = favorite.moverId;
    if (!favoriteCounts[moverId]) {
      favoriteCounts[moverId] = 0;
    }
    favoriteCounts[moverId]++;
  }

  // 각 기사의 찜 카운트 업데이트
  for (const [moverId, count] of Object.entries(favoriteCounts)) {
    await prisma.user.update({
      where: { id: moverId },
      data: { totalFavoriteCount: count },
    });
  }

  console.log("✅ Seed completed successfully! (30명 단위)");
  console.log(`👤 Created ${users.length} users (고객 30명, 기사 30명)`);
  console.log(`🏠 Created ${addresses.length} addresses`);
  console.log(`📋 Created ${estimateRequestsResult.length} estimate requests`);
  console.log(`💰 Created ${estimatesResult.length} estimates`);
  console.log(`⭐ Created ${reviewsResult.length} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

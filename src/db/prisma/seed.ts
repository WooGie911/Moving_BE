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
    });
  }

  for (let i = 0; i < 30; i++) {
    userArr.push({
      email: `mover${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 1}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${2000 + i}-${2000 + i}`),
      name: moverNames[i],
      userType: [UserType.MOVER],
      provider: AuthProvider.LOCAL,
      nickname: `mover_${i + 1}`,
      customerImage: "",
      moverImage: "",
      currentArea: getRandom([
        RegionType.SEOUL,
        RegionType.GYEONGGI,
        RegionType.BUSAN,
        RegionType.DAEGU,
        RegionType.INCHEON,
      ]),
      totalReviewCount: 0,
      averageRating: 0,
      workedCount: 0,
      totalFavoriteCount: 0,
    });
  }

  const users = await prisma.user.createMany({ data: userArr });
  const createdUsers = await prisma.user.findMany();
  const customerUsers = createdUsers.filter((u) => u.userType.includes(UserType.CUSTOMER));
  const moverUsers = createdUsers.filter((u) => u.userType.includes(UserType.MOVER));

  // 기사님 서비스 지역 설정
  const serviceAreas = [];
  for (const mover of moverUsers) {
    // 각 기사당 3개 지역 설정
    const regions = [RegionType.SEOUL, RegionType.GYEONGGI, RegionType.BUSAN];
    for (const region of regions) {
      serviceAreas.push({
        userId: mover.id,
        region: region,
        district: "강남구", // 기본 구 설정
      });
    }
  }
  await prisma.moverServiceArea.createMany({ data: serviceAreas });

  // 고객 주소 설정
  const userAddresses = [];
  for (const customer of customerUsers) {
    const randomAddresses = addresses.slice(0, 3); // 각 고객당 3개 주소
    for (let i = 0; i < randomAddresses.length; i++) {
      userAddresses.push({
        userId: customer.id,
        addressId: randomAddresses[i].id,
        role: i === 0 ? AddressRole.FROM : AddressRole.TO, // 첫 번째는 출발지, 나머지는 도착지
      });
    }
  }
  await prisma.userAddress.createMany({ data: userAddresses });

  // ===== 기사님 일정 관리 테스트를 위한 특별 데이터 생성 =====
  console.log("📅 기사님 일정 관리 테스트 데이터 생성 중...");

  // 테스트용 기사님 (첫 번째 기사님)
  const testMover = moverUsers[0];
  console.log(`🎯 테스트 기사님: ${testMover.name} (${testMover.email})`);

  // 테스트용 고객들 (첫 번째부터 10번째까지)
  const testCustomers = customerUsers.slice(0, 10);

  // 2025년 8월로 고정된 날짜들 생성
  const fixedYear = 2025;
  const fixedMonth = 8; // 8월

  // 2025년 8월의 다양한 날짜들 (시간 정보 완전 제거)
  const testDates = [
    // 8월 날짜들 (확정된 견적)
    new Date(fixedYear, fixedMonth - 1, 5, 0, 0, 0, 0), // 5일
    new Date(fixedYear, fixedMonth - 1, 8, 0, 0, 0, 0), // 8일
    new Date(fixedYear, fixedMonth - 1, 12, 0, 0, 0, 0), // 12일
    new Date(fixedYear, fixedMonth - 1, 15, 0, 0, 0, 0), // 15일
    new Date(fixedYear, fixedMonth - 1, 18, 0, 0, 0, 0), // 18일

    // 8월 날짜들 (완료된 견적)
    new Date(fixedYear, fixedMonth - 1, 22, 0, 0, 0, 0), // 22일
    new Date(fixedYear, fixedMonth - 1, 25, 0, 0, 0, 0), // 25일
    new Date(fixedYear, fixedMonth - 1, 28, 0, 0, 0, 0), // 28일
    new Date(fixedYear, fixedMonth - 1, 30, 0, 0, 0, 0), // 30일
    new Date(fixedYear, fixedMonth, 2, 0, 0, 0, 0), // 9월 2일
  ];

  // 이사 유형들
  const moveTypes = [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE];

  // 견적 요청 생성 (테스트용)
  const testEstimateRequests = [];

  for (let i = 0; i < testCustomers.length; i++) {
    const customer = testCustomers[i];
    const moveDate = testDates[i];
    const moveType = moveTypes[i % moveTypes.length];

    // 고객의 주소들 가져오기
    const customerAddresses = await prisma.userAddress.findMany({
      where: { userId: customer.id },
      include: { address: true },
    });

    const fromAddress = customerAddresses.find((ua) => ua.role === AddressRole.FROM)?.address;
    const toAddress = customerAddresses.find((ua) => ua.role === AddressRole.TO)?.address;

    if (fromAddress && toAddress) {
      testEstimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: customer.id,
            moveType: moveType,
            moveDate: moveDate,
            fromAddressId: fromAddress.id,
            toAddressId: toAddress.id,
            status: i < 5 ? RequestStatus.APPROVED : RequestStatus.COMPLETED, // 앞 5개는 확정, 뒤 5개는 완료
            description: `${customer.name}님의 ${moveType === MoveType.SMALL ? "소형" : moveType === MoveType.HOME ? "가정" : "사무실"}이사 요청입니다.`,
          },
        }),
      );
    }
  }

  const testEstimateRequestsResult = await Promise.all(testEstimateRequests);
  console.log(`✅ ${testEstimateRequestsResult.length}개의 테스트 견적 요청 생성 완료`);

  // 테스트 기사님이 보낸 견적들 생성 (모두 ACCEPTED 상태로)
  const testEstimates = [];

  for (let i = 0; i < testEstimateRequestsResult.length; i++) {
    const estimateRequest = testEstimateRequestsResult[i];

    testEstimates.push(
      prisma.estimate.create({
        data: {
          moverId: testMover.id,
          estimateRequestId: estimateRequest.id,
          price: Math.floor((200000 + Math.floor(Math.random() * 300000)) / 5000) * 5000, // 20만원 ~ 50만원
          comment: `${testMover.name}입니다. 안전하고 신속하게 이사해드리겠습니다!`,
          status: EstimateStatus.ACCEPTED, // 모든 견적을 ACCEPTED 상태로 설정
          workingHours: `${3 + (i % 3)}-${5 + (i % 3)}시간`,
          includesPackaging: i % 2 === 0,
          insuranceAmount: 1000000 + i * 50000,
        },
      }),
    );
  }

  const testEstimatesResult = await Promise.all(testEstimates);
  console.log(`✅ ${testEstimatesResult.length}개의 테스트 견적 생성 완료 (모두 ACCEPTED 상태)`);

  // 확정된 견적들에 대한 리뷰 생성
  const testReviews = [];

  for (let i = 0; i < 5; i++) {
    // 확정된 견적 5개에 대해 리뷰
    const estimateRequest = testEstimateRequestsResult[i];
    const acceptedEstimate = testEstimatesResult[i];

    testReviews.push(
      prisma.review.create({
        data: {
          customerId: estimateRequest.customerId,
          moverId: testMover.id,
          estimateRequestId: estimateRequest.id,
          rating: 4 + Math.floor(Math.random() * 2), // 4~5점
          content: `${testMover.name}님이 정말 친절하고 신속하게 이사해주셨습니다. 추천합니다!`,
          status: ReviewStatus.COMPLETED,
        },
      }),
    );
  }

  const testReviewsResult = await Promise.all(testReviews);
  console.log(`✅ ${testReviewsResult.length}개의 테스트 리뷰 생성 완료`);

  // 테스트 기사님의 통계 업데이트
  await prisma.user.update({
    where: { id: testMover.id },
    data: {
      totalReviewCount: testReviewsResult.length,
      averageRating: 4.5, // 평균 평점
      workedCount: 5, // 완료된 작업 수
    },
  });

  console.log(`🎯 테스트 기사님 ${testMover.name}의 일정 관리 데이터 생성 완료!`);
  console.log(
    `📅 2025년 8월 (확정된 견적): ${testDates
      .slice(0, 5)
      .map((d) => d.getDate() + "일")
      .join(", ")}`,
  );
  console.log(
    `📅 2025년 8월 (완료된 견적): ${testDates
      .slice(5)
      .map((d) => d.getDate() + "일")
      .join(", ")}`,
  );
  console.log(`✅ 확정된 견적: 5개, 완료된 견적: 5개`);
  console.log(`✅ 모든 견적이 ACCEPTED 상태로 생성됨`);

  // ===== 기존 시드 데이터 생성 (기존 코드 유지) =====

  // 견적 요청 생성 (기존 로직)
  const estimateRequests = [];
  for (let i = 0; i < 30; i++) {
    const customer = customerUsers[i];
    const customerAddresses = await prisma.userAddress.findMany({
      where: { userId: customer.id },
      include: { address: true },
    });

    const fromAddress = customerAddresses.find((ua) => ua.role === AddressRole.FROM)?.address;
    const toAddress = customerAddresses.find((ua) => ua.role === AddressRole.TO)?.address;

    if (fromAddress && toAddress) {
      // 대기중인 견적 요청 (1개)
      estimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: customer.id,
            moveType: getRandom([MoveType.SMALL, MoveType.HOME, MoveType.OFFICE]),
            moveDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // 30일 내 랜덤
            fromAddressId: fromAddress.id,
            toAddressId: toAddress.id,
            status: RequestStatus.PENDING,
            description: `${customer.name}님의 이사 요청입니다.`,
          },
        }),
      );

      // 완료된 견적 요청들 (4개)
      for (let j = 0; j < 4; j++) {
        estimateRequests.push(
          prisma.estimateRequest.create({
            data: {
              customerId: customer.id,
              moveType: getRandom([MoveType.SMALL, MoveType.HOME, MoveType.OFFICE]),
              moveDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // 30일 전 랜덤
              fromAddressId: fromAddress.id,
              toAddressId: toAddress.id,
              status: RequestStatus.COMPLETED,
              description: `${customer.name}님의 이사 요청입니다.`,
            },
          }),
        );
      }
    }
  }

  const estimateRequestsResult = await Promise.all(estimateRequests);

  // 견적 생성 (기존 로직)
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
  console.log(`👤 Created ${users.count} users (고객 30명, 기사 30명)`);
  console.log(`🏠 Created ${addresses.length} addresses`);
  console.log(`📋 Created ${estimateRequestsResult.length} estimate requests`);
  console.log(`💰 Created ${estimatesResult.length} estimates`);
  console.log(`⭐ Created ${reviewsResult.length} reviews`);
  console.log(`🎯 테스트 기사님: ${testMover.name} (${testMover.email})`);
  console.log(`📅 테스트 일정: 이번 달 5개, 다음 달 5개`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

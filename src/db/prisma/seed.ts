import {
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
import prisma from "./prisma";

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadJsonData(filename: string): any {
  const filePath = path.join(__dirname, "seed-data", filename);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}

function sanitizeNickname(nickname: string): string {
  // 한글/영문/숫자만 허용, 그 외 문자 제거
  const cleaned = nickname.replace(/[^0-9A-Za-z가-힣]/g, "");
  // 앞뒤 공백 제거 및 빈 값 방지
  return cleaned.trim();
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
  const addressData = loadJsonData("addresses.json").slice(0, 60);
  const userData = loadJsonData("users.json");
  const reviewTemplates = loadJsonData("review-templates.json");

  // 주소 생성 (다양한 권역 확대)
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

  // 사용자 규모 설정 (실서비스스러운 볼륨)
  const NUM_CUSTOMERS = 60;
  const NUM_MOVERS = 40;
  const NUM_DUAL_ROLE = 10; // 고객+기사 겸업

  const baseCustomerNames: string[] = userData.customers;
  const baseMoverNames: string[] = userData.movers;
  const baseCustomerNick: string[] = userData.customerNicknames;
  const baseMoverNick: string[] = userData.moverNicknames;

  const pickCycled = (arr: string[], idx: number) => arr[idx % arr.length];

  const userArr: any[] = [];

  // 고객만
  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const name = pickCycled(baseCustomerNames, i);
    const nick = sanitizeNickname(`${pickCycled(baseCustomerNick, i)}${i + 1}`);
    userArr.push({
      email: `customer${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 1}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${1000 + i}-${1000 + i}`),
      name,
      userType: [UserType.CUSTOMER],
      provider: AuthProvider.LOCAL,
      nickname: nick,
      customerImage: "",
      moverImage: "",
      currentArea: getRandom([
        RegionType.SEOUL,
        RegionType.GYEONGGI,
        RegionType.BUSAN,
        RegionType.DAEGU,
        RegionType.INCHEON,
      ]),
      isCustomer: true,
      isMover: false,
      preferredServices: getRandom([
        [MoveType.SMALL],
        [MoveType.HOME],
        [MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME],
        [MoveType.HOME, MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
      ]),
    });
  }

  // 기사만
  for (let i = 0; i < NUM_MOVERS; i++) {
    const name = pickCycled(baseMoverNames, i);
    const nick = sanitizeNickname(`${pickCycled(baseMoverNick, i)}${i + 1}`);
    userArr.push({
      email: `mover${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 1}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${2000 + i}-${2000 + i}`),
      name,
      userType: [UserType.MOVER],
      provider: AuthProvider.LOCAL,
      nickname: nick,
      customerImage: "",
      moverImage: "",
      isCustomer: false,
      isMover: true,
      shortIntro: `${name}입니다. ${i % 3 === 0 ? "소형 이사" : i % 3 === 1 ? "가정 이사" : "사무실 이사"} 전문입니다.`,
      detailIntro: `${name}입니다. ${i % 3 === 0 ? "소형 이사" : i % 3 === 1 ? "가정 이사" : "사무실 이사"} 경험 ${5 + (i % 10)}년의 전문 기사입니다. 안전하고 신속하게 이사해드리겠습니다.`,
      career: 5 + (i % 10),
      workedCount: 0,
      averageRating: 0,
      totalReviewCount: 0,
      totalFavoriteCount: 0,
      serviceTypes: getRandom([
        [MoveType.SMALL],
        [MoveType.HOME],
        [MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME],
        [MoveType.HOME, MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
      ]),
      currentAreas: getRandom([
        [RegionType.SEOUL],
        [RegionType.GYEONGGI],
        [RegionType.BUSAN],
        [RegionType.SEOUL, RegionType.GYEONGGI],
        [RegionType.BUSAN, RegionType.DAEGU],
        [RegionType.SEOUL, RegionType.GYEONGGI, RegionType.BUSAN],
      ]),
      isVeteran: i % 5 === 0,
    });
  }

  // 고객+기사 겸업
  for (let i = 0; i < NUM_DUAL_ROLE; i++) {
    const idx = i + 1;
    const name = `겸업${pickCycled(baseCustomerNames, i)}`;
    userArr.push({
      email: `hybrid${idx}@test.com`,
      encryptedPassword: await bcrypt.hash(`Hybrid!Pass${idx}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${3000 + i}-${3000 + i}`),
      name,
      userType: [UserType.CUSTOMER, UserType.MOVER],
      provider: AuthProvider.LOCAL,
      nickname: sanitizeNickname(`겸업${idx}`),
      customerImage: "",
      moverImage: "",
      currentArea: getRandom([
        RegionType.SEOUL,
        RegionType.GYEONGGI,
        RegionType.BUSAN,
        RegionType.DAEGU,
        RegionType.INCHEON,
      ]),
      isCustomer: true,
      isMover: true,
      preferredServices: getRandom([
        [MoveType.SMALL],
        [MoveType.HOME],
        [MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME],
        [MoveType.HOME, MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
      ]),
      shortIntro: `${name}입니다. 고객 및 기사 겸업 중입니다.`,
      detailIntro: `${name}입니다. 다양한 이사 경험을 보유했고, 고객 입장도 잘 이해합니다.`,
      career: 3 + (i % 5),
      workedCount: 0,
      averageRating: 0,
      totalReviewCount: 0,
      totalFavoriteCount: 0,
      serviceTypes: getRandom([
        [MoveType.SMALL],
        [MoveType.HOME],
        [MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME],
        [MoveType.HOME, MoveType.OFFICE],
        [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
      ]),
      currentAreas: getRandom([
        [RegionType.SEOUL],
        [RegionType.GYEONGGI],
        [RegionType.BUSAN],
        [RegionType.SEOUL, RegionType.GYEONGGI],
        [RegionType.BUSAN, RegionType.DAEGU],
        [RegionType.SEOUL, RegionType.GYEONGGI, RegionType.BUSAN],
      ]),
      isVeteran: i % 2 === 0,
    });
  }

  const users = await prisma.user.createMany({ data: userArr });
  const createdUsers = await prisma.user.findMany();
  const customerUsers = createdUsers.filter((u) => u.userType.includes(UserType.CUSTOMER));
  const moverUsers = createdUsers.filter((u) => u.userType.includes(UserType.MOVER));

  // 기사님 서비스 지역 설정 (각 3개 지역)
  const serviceAreas: any[] = [];
  for (const mover of moverUsers) {
    const regionsPool = [RegionType.SEOUL, RegionType.GYEONGGI, RegionType.BUSAN, RegionType.DAEGU, RegionType.INCHEON];
    const selected = new Set<RegionType>();
    while (selected.size < 3) selected.add(getRandom(regionsPool));
    for (const region of selected) {
      serviceAreas.push({ userId: mover.id, region, district: "강남구" });
    }
  }
  await prisma.moverServiceArea.createMany({ data: serviceAreas });

  // 고객 주소 설정 (각 고객 3개: FROM 1, TO 2)
  const userAddresses: any[] = [];
  for (const customer of customerUsers) {
    const randomAddresses = addresses
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    for (let i = 0; i < randomAddresses.length; i++) {
      userAddresses.push({
        userId: customer.id,
        addressId: randomAddresses[i].id,
        role: i === 0 ? AddressRole.FROM : AddressRole.TO,
      });
    }
  }
  await prisma.userAddress.createMany({ data: userAddresses });

  // ===== 시나리오별 데이터 생성 =====
  console.log("📝 시나리오별 데이터 생성 중...");

  // 기준 날짜 설정 (2025-08-08)
  const today = new Date(2025, 7, 8, 0, 0, 0, 0); // 2025년 8월 8일
  const yesterday = new Date(2025, 7, 7, 0, 0, 0, 0); // 2025년 8월 7일

  console.log(`📅 기준 날짜: ${today.toLocaleDateString("ko-KR")}`);

  // 이사 유형들
  const moveTypes = [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE];

  // 1. 고객별 진행중(PENDING) 견적 요청 1개 생성 (미래 날짜)
  const pendingEstimateRequests: any[] = [];
  for (const customer of customerUsers) {
    const customerAddresses = await prisma.userAddress.findMany({
      where: { userId: customer.id },
      include: { address: true },
    });
    const fromAddress = customerAddresses.find((ua) => ua.role === AddressRole.FROM)?.address;
    const toAddress = customerAddresses.find((ua) => ua.role === AddressRole.TO)?.address;
    if (!fromAddress || !toAddress) continue;
    const moveType = moveTypes[customer.name!.length % moveTypes.length];
    const moveDate = new Date(today);
    moveDate.setDate(today.getDate() + 3 + Math.floor(Math.random() * 5));
    pendingEstimateRequests.push(
      prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          moveType,
          moveDate,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          status: RequestStatus.PENDING,
          description: `${customer.name}님의 ${moveType === MoveType.SMALL ? "소형" : moveType === MoveType.HOME ? "가정" : "사무실"} 이사 요청입니다.`,
        },
      }),
    );
  }

  const pendingRequestsResult = await Promise.all(pendingEstimateRequests);
  console.log(`✅ ${pendingRequestsResult.length}개의 PENDING 견적 요청 생성 완료`);

  // 2. 각 PENDING 요청마다 정확히 3명의 기사 일반 견적(PROPOSED) 생성
  const proposedEstimates: any[] = [];
  for (const request of pendingRequestsResult) {
    const shuffledMovers = moverUsers
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    for (const mover of shuffledMovers) {
      proposedEstimates.push(
        prisma.estimate.create({
          data: {
            moverId: mover.id,
            estimateRequestId: request.id,
            price: Math.floor((150000 + Math.floor(Math.random() * 350000)) / 5000) * 5000,
            comment: `${mover.name}입니다. 일반 견적 제안드립니다.`,
            status: EstimateStatus.PROPOSED,
            isDesignated: false,
            workingHours: `${2 + Math.floor(Math.random() * 4)}-${4 + Math.floor(Math.random() * 4)}시간`,
            includesPackaging: Math.random() > 0.5,
            insuranceAmount: 1000000 + Math.floor(Math.random() * 2000000),
          },
        }),
      );
    }
  }

  const proposedEstimatesResult = await Promise.all(proposedEstimates);
  console.log(`✅ ${proposedEstimatesResult.length}개의 PROPOSED 견적 생성 완료`);

  // 3. 고객별 완료된(COMPLETED) 견적 요청 3개씩 생성 (과거 날짜)
  const completedEstimateRequests: any[] = [];
  for (const customer of customerUsers) {
    const customerAddresses = await prisma.userAddress.findMany({
      where: { userId: customer.id },
      include: { address: true },
    });
    const fromAddress = customerAddresses.find((ua) => ua.role === AddressRole.FROM)?.address;
    const toAddress = customerAddresses.find((ua) => ua.role === AddressRole.TO)?.address;
    if (!fromAddress || !toAddress) continue;

    for (let j = 0; j < 3; j++) {
      const moveType = moveTypes[(j + customer.name!.length) % moveTypes.length];
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - (7 + j * 3 + Math.floor(Math.random() * 5)));
      completedEstimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: customer.id,
            moveType,
            moveDate: pastDate,
            fromAddressId: fromAddress.id,
            toAddressId: toAddress.id,
            status: RequestStatus.COMPLETED,
            description: `${customer.name}님의 ${moveType === MoveType.SMALL ? "소형" : moveType === MoveType.HOME ? "가정" : "사무실"} 이사가 완료되었습니다.`,
          },
        }),
      );
    }
  }

  const completedRequestsResult = await Promise.all(completedEstimateRequests);
  console.log(`✅ ${completedRequestsResult.length}개의 COMPLETED 견적 요청 생성 완료`);

  // 4. 완료된 요청들에 대한 견적 5개 생성 (1 ACCEPTED, 4 AUTO_REJECTED)
  const acceptedEstimates: any[] = [];
  const autoRejectedEstimates: any[] = [];
  for (const request of completedRequestsResult) {
    const selectedMovers = moverUsers
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    const winner = selectedMovers[0];
    acceptedEstimates.push(
      prisma.estimate.create({
        data: {
          moverId: winner.id,
          estimateRequestId: request.id,
          price: Math.floor((200000 + Math.floor(Math.random() * 300000)) / 5000) * 5000,
          comment: `${winner.name}입니다. 안전하고 신속하게 이사 완료했습니다!`,
          status: EstimateStatus.ACCEPTED,
          isDesignated: false,
          workingHours: `${3 + Math.floor(Math.random() * 3)}-${5 + Math.floor(Math.random() * 3)}시간`,
          includesPackaging: Math.random() > 0.3,
          insuranceAmount: 1000000 + Math.floor(Math.random() * 2000000),
        },
      }),
    );
    for (const loser of selectedMovers.slice(1)) {
      autoRejectedEstimates.push(
        prisma.estimate.create({
          data: {
            moverId: loser.id,
            estimateRequestId: request.id,
            price: Math.floor((200000 + Math.floor(Math.random() * 300000)) / 5000) * 5000,
            comment: `${loser.name}입니다. 선정되지 않아 자동 거절되었습니다.`,
            status: EstimateStatus.AUTO_REJECTED,
            isDesignated: false,
          },
        }),
      );
    }
  }
  await Promise.all(autoRejectedEstimates);

  const acceptedEstimatesResult = await Promise.all(acceptedEstimates);
  console.log(`✅ ${acceptedEstimatesResult.length}개의 ACCEPTED 견적 생성 완료`);

  // 5. 리뷰 생성 (완료된 요청 전부 리뷰 작성)
  const completedReviews: any[] = [];
  const requestIdToAccepted = new Map<string, (typeof acceptedEstimatesResult)[number]>();
  for (const est of acceptedEstimatesResult) requestIdToAccepted.set(est.estimateRequestId, est);
  const reviewContentsAll: string[] = [...reviewTemplates.positive, ...reviewTemplates.neutral];
  for (let i = 0; i < completedRequestsResult.length; i++) {
    const request = completedRequestsResult[i];
    const acceptedEstimate = requestIdToAccepted.get(request.id)!;
    completedReviews.push(
      prisma.review.create({
        data: {
          customerId: request.customerId,
          moverId: acceptedEstimate.moverId,
          estimateRequestId: request.id,
          rating: 3 + Math.floor(Math.random() * 3),
          content: reviewContentsAll[i % reviewContentsAll.length],
          status: ReviewStatus.COMPLETED,
        },
      }),
    );
  }

  const reviewsResult = await Promise.all(completedReviews);
  console.log(`✅ ${reviewsResult.length}개의 리뷰 생성 완료`);

  console.log("📊 시나리오별 데이터 생성 완료!");
  console.log(`📝 PENDING 요청 수: ${pendingRequestsResult.length}개`);
  console.log(`🚚 기사 수: ${moverUsers.length}명`);
  console.log(`✅ 완료된 이사(고객당 3개): ${completedRequestsResult.length}개`);
  console.log(`⭐ 리뷰 작성 완료: ${reviewsResult.length}개`);

  // 5-1. 기사별 리뷰 보정: 최소 15 ~ 최대 30개가 되도록 추가 생성
  const currentReviewsByMover: Record<string, number> = {};
  for (const r of reviewsResult) currentReviewsByMover[r.moverId] = (currentReviewsByMover[r.moverId] || 0) + 1;
  const topUpReviews: any[] = [];
  const additionalAccepted: any[] = [];
  for (const mover of moverUsers) {
    const nowCount = currentReviewsByMover[mover.id] || 0;
    const target = 15 + Math.floor(Math.random() * 16); // 15~30
    const needed = Math.max(0, target - nowCount);
    if (needed === 0) continue;
    // 필요한 개수만큼 과거 완료 요청/수락/리뷰 생성
    for (let k = 0; k < needed; k++) {
      const customer = customerUsers[(k + mover.name!.length) % customerUsers.length];
      const customerAddresses = await prisma.userAddress.findMany({
        where: { userId: customer.id },
        include: { address: true },
      });
      const fromAddress = customerAddresses.find((ua) => ua.role === AddressRole.FROM)?.address;
      const toAddress = customerAddresses.find((ua) => ua.role === AddressRole.TO)?.address;
      if (!fromAddress || !toAddress) continue;
      const moveType = moveTypes[(k + customer.name!.length) % moveTypes.length];
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - (15 + k + Math.floor(Math.random() * 20)));
      const req = await prisma.estimateRequest.create({
        data: {
          customerId: customer.id,
          moveType,
          moveDate: pastDate,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          status: RequestStatus.COMPLETED,
          description: `${customer.name}님의 완료된 이사입니다.`,
        },
      });
      const est = await prisma.estimate.create({
        data: {
          moverId: mover.id,
          estimateRequestId: req.id,
          price: Math.floor((200000 + Math.floor(Math.random() * 300000)) / 5000) * 5000,
          comment: `${mover.name}입니다. 완료 처리되었습니다.`,
          status: EstimateStatus.ACCEPTED,
          isDesignated: false,
        },
      });
      additionalAccepted.push(est);
      topUpReviews.push(
        prisma.review.create({
          data: {
            customerId: req.customerId,
            moverId: mover.id,
            estimateRequestId: req.id,
            rating: 3 + Math.floor(Math.random() * 3),
            content: reviewContentsAll[k % reviewContentsAll.length],
            status: ReviewStatus.COMPLETED,
          },
        }),
      );
    }
  }
  const topUpReviewsResult = await Promise.all(topUpReviews);
  console.log(`⭐ 기사별 리뷰 보정 추가 생성: ${topUpReviewsResult.length}개`);

  // 기사님 통계 업데이트 (DB 기준으로 정확히 집계)
  const acceptedCounts = await prisma.estimate.groupBy({
    by: ["moverId"],
    where: { status: EstimateStatus.ACCEPTED, deletedAt: null },
    _count: { _all: true },
  });
  const reviewAggs = await prisma.review.groupBy({
    by: ["moverId"],
    where: { status: ReviewStatus.COMPLETED, deletedAt: null },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const moverIdToAccepted: Record<string, number> = {};
  for (const row of acceptedCounts) moverIdToAccepted[row.moverId] = row._count._all;
  const moverIdToReview: Record<string, { count: number; avg: number }> = {};
  for (const row of reviewAggs) moverIdToReview[row.moverId] = { count: row._count._all, avg: row._avg.rating ?? 0 };

  for (const mover of moverUsers) {
    const worked = moverIdToAccepted[mover.id] ?? 0;
    const r = moverIdToReview[mover.id] ?? { count: 0, avg: 0 };
    await prisma.user.update({
      where: { id: mover.id },
      data: {
        workedCount: worked,
        totalReviewCount: r.count,
        averageRating: r.avg ?? 0,
      },
    });
  }

  // 찜 생성 (고객 전원 → 기사 라운드로빈)
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

  // ===== 액션 데이터 생성 =====
  console.log("🎯 액션 데이터 생성 중...");

  // 액션 데이터 생성
  const actions = [];

  // 1. WELCOME 액션들
  for (let i = 0; i < Math.min(10, customerUsers.length, moverUsers.length); i++) {
    const customer = customerUsers[i];
    const mover = moverUsers[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "WELCOME",
          entityId: customer.id,
          entityType: "USER",
          description: "회원가입을 환영합니다.",
          metadata: {},
        },
      }),
    );

    actions.push(
      prisma.action.create({
        data: {
          userId: mover.id,
          type: "WELCOME",
          entityId: mover.id,
          entityType: "USER",
          description: "기사님 등록을 환영합니다.",
          metadata: {},
        },
      }),
    );
  }

  // 2. ESTIMATE_REQUEST_CREATE 액션들
  for (let i = 0; i < Math.min(10, pendingRequestsResult.length); i++) {
    const customer = customerUsers[i];
    const request = pendingRequestsResult[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "ESTIMATE_REQUEST_CREATE",
          entityId: request.id,
          entityType: "ESTIMATE_REQUEST",
          description: "견적 요청을 생성했습니다.",
          metadata: {},
        },
      }),
    );
  }

  // 3. ESTIMATE_SUBMITTED 액션들
  for (let i = 0; i < Math.min(10, proposedEstimatesResult.length, pendingRequestsResult.length); i++) {
    const mover = moverUsers[i];
    const estimate = proposedEstimatesResult[i];
    const request = pendingRequestsResult[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: mover.id,
          type: "ESTIMATE_SUBMITTED",
          entityId: estimate.id,
          entityType: "ESTIMATE",
          description: "견적을 제출했습니다.",
          metadata: {
            moverName: mover.name,
            moveType: request.moveType,
          },
        },
      }),
    );
  }

  // 4. ESTIMATE_ACCEPTED 액션들
  for (let i = 0; i < Math.min(10, acceptedEstimatesResult.length, completedRequestsResult.length); i++) {
    const customer = customerUsers[i];
    const mover = moverUsers[i];
    const estimate = acceptedEstimatesResult[i];
    const request = completedRequestsResult[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "ESTIMATE_ACCEPTED",
          entityId: estimate.id,
          entityType: "ESTIMATE",
          description: "견적을 수락했습니다.",
          metadata: {
            moverName: mover.name,
            customerName: customer.name,
            estimateRequestId: request.id,
            estimateId: estimate.id,
            moveType: request.moveType,
          },
        },
      }),
    );
  }

  // 5. ESTIMATE_REJECTED 액션들
  for (let i = 0; i < Math.min(5, proposedEstimatesResult.length - 3, customerUsers.length - 3); i++) {
    const customer = customerUsers[i + 3];
    const mover = moverUsers[i + 3];
    const estimate = proposedEstimatesResult[i + 3];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "ESTIMATE_REJECTED",
          entityId: estimate.id,
          entityType: "ESTIMATE",
          description: "견적을 거절했습니다.",
          metadata: {
            moveType: "SMALL",
            customerName: customer.name,
          },
        },
      }),
    );
  }

  // 6. REVIEW_SUBMITTED 액션들
  for (let i = 0; i < Math.min(10, reviewsResult.length); i++) {
    const customer = customerUsers[i];
    const review = reviewsResult[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "REVIEW_SUBMITTED",
          entityId: review.id,
          entityType: "REVIEW",
          description: "리뷰를 작성했습니다.",
          metadata: {
            moverId: review.moverId,
          },
        },
      }),
    );
  }

  // 7. FAVORITE_ADDED 액션들
  for (let i = 0; i < Math.min(10, customerUsers.length, moverUsers.length); i++) {
    const customer = customerUsers[i];
    const mover = moverUsers[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "FAVORITE_ADDED",
          entityId: `fav_${i + 1}`,
          entityType: "FAVORITE",
          description: "기사님을 찜했습니다.",
          metadata: {
            moverId: mover.id,
          },
        },
      }),
    );
  }

  // 8. FAVORITE_REMOVED 액션들
  for (let i = 0; i < Math.min(5, customerUsers.length - 3, moverUsers.length - 3); i++) {
    const customer = customerUsers[i + 3];
    const mover = moverUsers[i + 3];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "FAVORITE_REMOVED",
          entityId: `fav_removed_${i + 1}`,
          entityType: "FAVORITE",
          description: "찜을 해제했습니다.",
          metadata: {
            moverId: mover.id,
          },
        },
      }),
    );
  }

  // 9. MOVE_DAY_REMINDER 액션들
  for (let i = 0; i < Math.min(5, pendingRequestsResult.length, customerUsers.length); i++) {
    const customer = customerUsers[i];
    const request = pendingRequestsResult[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "MOVE_DAY_REMINDER_TOMORROW",
          entityId: request.id,
          entityType: "ESTIMATE_REQUEST",
          description: "내일 이사 예정입니다.",
          metadata: {
            moveType: request.moveType,
          },
        },
      }),
    );

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "MOVE_DAY_REMINDER_TODAY",
          entityId: request.id,
          entityType: "ESTIMATE_REQUEST",
          description: "오늘 이사 예정입니다.",
          metadata: {
            moveType: request.moveType,
          },
        },
      }),
    );
  }

  // 10. MOVE_DAY_REVIEW_REQUEST 액션들
  for (let i = 0; i < Math.min(5, completedRequestsResult.length, customerUsers.length, moverUsers.length); i++) {
    const customer = customerUsers[i];
    const mover = moverUsers[i];
    const request = completedRequestsResult[i];

    actions.push(
      prisma.action.create({
        data: {
          userId: customer.id,
          type: "MOVE_DAY_REVIEW_REQUEST",
          entityId: request.id,
          entityType: "ESTIMATE_REQUEST",
          description: "리뷰 작성 기간이 시작되었습니다.",
          metadata: {
            moverName: mover.name,
          },
        },
      }),
    );
  }

  const actionsResult = await Promise.all(actions);
  console.log(`✅ ${actionsResult.length}개의 액션 생성 완료`);

  console.log("✅ 시드 데이터 생성 완료! (확장 버전)");
  console.log(`👤 생성된 사용자: ${users.count}명`);
  console.log(`🏠 생성된 주소: ${addresses.length}개`);
  console.log(`📝 PENDING 견적 요청: ${pendingRequestsResult.length}개`);
  console.log(`🚚 PROPOSED 견적(일반): ${proposedEstimatesResult.length}개 (기사 1인당 최대 5건)`);
  console.log(`✅ COMPLETED 견적 요청: ${completedRequestsResult.length}개`);
  console.log(`💰 ACCEPTED 견적: ${acceptedEstimatesResult.length}개`);
  console.log(`⭐ 생성된 리뷰(60%): ${reviewsResult.length}개`);
  console.log(`❤️ 생성된 찜: ${favoriteData.length}개`);
  console.log(`🎯 생성된 액션: ${actionsResult.length}개`);
  console.log(`📅 기준 날짜: ${today.toLocaleDateString("ko-KR")} (오늘)`);
  console.log(`📅 어제 완료: ${yesterday.toLocaleDateString("ko-KR")} (어제)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

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

  // 견적 요청 30개 생성 (고객 30명)
  const estimateRequestData = users
    .filter((u) => u.userType.includes(UserType.CUSTOMER))
    .slice(0, 30)
    .map((u, idx) => ({
      customerId: u.id,
      moveType: getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
      moveDate: new Date(2025, 6, 28 + (idx % 10)),
      fromAddressId: addresses[idx % addresses.length].id,
      toAddressId: addresses[(idx + 1) % addresses.length].id,
      status: RequestStatus.PENDING,
      description: `${u.name}님의 견적 요청`,
    }));
  await prisma.estimateRequest.createMany({ data: estimateRequestData });
  const estimateRequests = await prisma.estimateRequest.findMany();

  // 견적 30개 생성 (기사 30명)
  const estimateData = moverUsers.map((mover, idx) => ({
    moverId: mover.id,
    estimateRequestId: estimateRequests[idx % estimateRequests.length].id,
    price: 150000 + (idx % 10) * 5000,
    comment: `${mover.name}님의 견적 코멘트`,
    status: EstimateStatus.PROPOSED,
    workingHours: `${2 + (idx % 5)}- ${4 + (idx % 5)}시간`,
    includesPackaging: idx % 2 === 0,
    insuranceAmount: 1000000 + idx * 100000,
  }));
  await prisma.estimate.createMany({ data: estimateData });
  const estimates = await prisma.estimate.findMany();

  // 리뷰 30개 생성 (고객 30명)
  const reviewData = users
    .filter((u) => u.userType.includes(UserType.CUSTOMER))
    .slice(0, 30)
    .map((u, idx) => ({
      customerId: u.id,
      moverId: moverUsers[idx % moverUsers.length].id,
      estimateRequestId: estimateRequests[idx % estimateRequests.length].id,
      rating: 3 + (idx % 3),
      content: getRandom(reviewTemplates.positive) as string,
      status: ReviewStatus.COMPLETED,
    }));
  await prisma.review.createMany({ data: reviewData });

  // 리뷰 통계 업데이트
  const reviews = await prisma.review.findMany();
  const moverStats: { [key: string]: { reviewCount: number; totalRating: number } } = {};

  // 리뷰 데이터로 통계 계산
  for (const review of reviews) {
    const moverId = review.moverId;
    if (!moverStats[moverId]) {
      moverStats[moverId] = { reviewCount: 0, totalRating: 0 };
    }
    moverStats[moverId].reviewCount++;
    moverStats[moverId].totalRating += review.rating;
  }

  // 각 기사의 통계 업데이트 (순차적으로 처리)
  for (const [moverId, stats] of Object.entries(moverStats)) {
    await prisma.user.update({
      where: { id: moverId },
      data: {
        totalReviewCount: stats.reviewCount,
        averageRating: stats.reviewCount > 0 ? stats.totalRating / stats.reviewCount : 0,
      },
    });
  }

  // 찜 30개 생성 (고객 30명 -> 기사 30명)
  const favoriteData = users
    .filter((u) => u.userType.includes(UserType.CUSTOMER))
    .slice(0, 30)
    .map((u, idx) => ({
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

  // 각 기사의 찜 카운트 업데이트 (순차적으로 처리)
  for (const [moverId, count] of Object.entries(favoriteCounts)) {
    await prisma.user.update({
      where: { id: moverId },
      data: { totalFavoriteCount: count },
    });
  }

  console.log("✅ Seed completed successfully! (30명 단위)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

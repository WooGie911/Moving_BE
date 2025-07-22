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

  // DB 초기화 (모든 데이터 삭제)
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

  // 주소 데이터 생성 (20개)
  const addressData = Array.from({ length: 20 }).map((_, i) => ({
    postalCode: `1000${i}`,
    city: i % 2 === 0 ? "강남구" : "서초구",
    district: i % 2 === 0 ? `역삼동${i}` : `서초동${i}`,
    detail: `테스트로 ${i * 10}`,
    region: i % 2 === 0 ? RegionType.SEOUL : RegionType.GYEONGGI,
  }));
  const addresses = await Promise.all(
    addressData.map((data) => prisma.address.create({ data }))
  );

  // 유저 30명 생성 (모두 고객+기사)
  const allNames = [
    "김민수",
    "이서연",
    "박지훈",
    "최유진",
    "정우성",
    "한지민",
    "오세훈",
    "윤아름",
    "장동건",
    "신민아",
    "강호동",
    "이수근",
    "서장훈",
    "김영철",
    "이광수",
    "송지효",
    "유재석",
    "박명수",
    "정형돈",
    "노홍철",
    "이기사",
    "박기사",
    "최기사",
    "정기사",
    "박민규",
    "김수빈",
    "윤세준",
    "김승준",
    "김재욱",
    "백지연",
  ];
  const userArr = [];
  for (let i = 0; i < 30; i++) {
    userArr.push({
      email: `user${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 1}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${1000 + i}`),
      name: allNames[i],
      userType: [UserType.CUSTOMER, UserType.MOVER],

      provider: AuthProvider.LOCAL,
      nickname: allNames[i] + "닉네임",
      customerImage: "",
      moverImage: "",
      currentArea: getRandom([RegionType.SEOUL, RegionType.GYEONGGI]),

      preferredServices: [getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE])],
      shortIntro: `${allNames[i]}은(는) 친절하고 꼼꼼한 기사입니다!`,
      detailIntro: `${allNames[i]}은(는) 다양한 이사 경험을 바탕으로 최고의 서비스를 제공합니다.`,
      career: 5 + (i % 10),
      isVeteran: i % 2 === 0,
      workedCount: 10 + i * 2,
      averageRating: 4.2 + (i % 3) * 0.2,
      totalReviewCount: 5 + i,
      currentAreas: [getRandom([RegionType.SEOUL, RegionType.GYEONGGI])],
      serviceTypes: [getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE])],
      totalFavoriteCount: 0,
    });
  }
  const users = await Promise.all(userArr.map((data) => prisma.user.create({ data })));


  // 기사님 서비스 지역 (모든 유저)
  const moverUsers = users; // 모든 유저가 기사 역할
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

  // 견적 요청 60개 생성 (고객 역할 유저 랜덤)
  const estimateRequests = await Promise.all(
    Array.from({ length: 60 }).map((_, i) =>
      prisma.estimateRequest.create({
        data: {
          customerId: users[getRandom([...Array(users.length).keys()])].id,
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

  // 견적 80개 생성 (기사 역할 유저 랜덤, 중복 방지)
  const usedPairs = new Set();
  const estimatesArr = [];
  for (let i = 0; i < 80; i++) {
    let estimateRequestIdx, moverIdx, pairKey;
    let tryCount = 0;
    do {
      estimateRequestIdx = getRandom([...Array(estimateRequests.length).keys()]);
      moverIdx = getRandom([...Array(users.length).keys()]);
      pairKey = `${estimateRequestIdx}_${moverIdx}`;
      tryCount++;
      if (tryCount > 100) break; // 무한루프 방지
    } while (usedPairs.has(pairKey));
    usedPairs.add(pairKey);
    estimatesArr.push(
      prisma.estimate.create({
        data: {
          moverId: users[moverIdx].id,
          estimateRequestId: estimateRequests[estimateRequestIdx].id,
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

      }),
    );
  }
  const estimates = await Promise.all(estimatesArr);


  // 찜 100개 생성 (고객이 기사/하이브리드 찜, 모든 유저 랜덤, 중복 방지)
  const favoritePairs = new Set();
  const favoriteArr = [];
  let favoriteCount = 0;
  while (favoriteCount < 100) {
    const customerIdx = getRandom([...Array(users.length).keys()]);
    let moverIdx;
    do {
      moverIdx = getRandom([...Array(users.length).keys()]);
    } while (customerIdx === moverIdx);
    const pairKey = `${customerIdx}_${moverIdx}`;
    if (favoritePairs.has(pairKey)) continue;
    favoritePairs.add(pairKey);
    favoriteArr.push(
      prisma.favorite.create({
        data: {
          customerId: users[customerIdx].id,
          moverId: users[moverIdx].id,
        },
      })
    );
    // totalFavoriteCount 증가도 반영
    await prisma.user.update({
      where: { id: users[moverIdx].id },
      data: { totalFavoriteCount: { increment: 1 } },
    });
    favoriteCount++;
  }
  await Promise.all(favoriteArr);

  // 리뷰 30개 생성 (모든 유저 랜덤, estimateRequestId 중복 방지)
  const usedEstimateRequestIds = new Set();
  const reviewArr = [];
  let reviewCount = 0;
  while (reviewCount < 30 && usedEstimateRequestIds.size < estimateRequests.length) {
    let estimateRequestIdx;
    do {
      estimateRequestIdx = getRandom([...Array(estimateRequests.length).keys()]);
    } while (usedEstimateRequestIds.has(estimateRequestIdx));
    usedEstimateRequestIds.add(estimateRequestIdx);

    let customer, mover;
    do {
      customer = users[getRandom([...Array(users.length).keys()])];
      mover = users[getRandom([...Array(users.length).keys()])];
    } while (customer.id === mover.id);

    reviewArr.push(
      prisma.review.create({
        data: {
          customerId: customer.id,
          moverId: mover.id,
          estimateRequestId: estimateRequests[estimateRequestIdx].id,
          rating: 3 + (reviewCount % 3),
          content: `테스트 리뷰 내용 ${reviewCount + 1}`,
        },

      }),
    );
    reviewCount++;
  }
  await Promise.all(reviewArr);


  // 사용자 활동 30개 생성
  const actions = await Promise.all(
    Array.from({ length: 30 }).map((_, i) =>
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

  // 알림 30개 생성
  await Promise.all(
    Array.from({ length: 30 }).map((_, i) =>
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
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

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

  // 고객/기사 10명씩 생성
  const customerNames = userData.customers.slice(0, 10);
  const moverNames = userData.movers.slice(0, 10);
  const customerNicknames = userData.customerNicknames.slice(0, 10);
  const moverNicknames = userData.moverNicknames.slice(0, 10);
  const userArr = [];
  for (let i = 0; i < 10; i++) {
    userArr.push({
      email: `customer${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 1}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${1000 + i}-${1000 + i}`),
      name: customerNames[i],
      userType: [UserType.CUSTOMER],
      provider: AuthProvider.LOCAL,
      nickname: customerNicknames[i],
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

  for (let i = 0; i < 10; i++) {
    userArr.push({
      email: `mover${i + 1}@test.com`,
      encryptedPassword: await bcrypt.hash(`Test!Pass${i + 1}@2024`, 10),
      encryptedPhoneNumber: encryptPhoneNumber(`010-${2000 + i}-${2000 + i}`),
      name: moverNames[i],
      userType: [UserType.MOVER],
      provider: AuthProvider.LOCAL,
      nickname: moverNicknames[i],
      customerImage: "",
      moverImage: "",
      isCustomer: false,
      isMover: true,
      shortIntro: `${moverNames[i]}입니다. ${i % 3 === 0 ? "소형 이사" : i % 3 === 1 ? "가정 이사" : "사무실 이사"} 전문입니다.`,
      detailIntro: `${moverNames[i]}입니다. ${i % 3 === 0 ? "소형 이사" : i % 3 === 1 ? "가정 이사" : "사무실 이사"} 경험 ${5 + (i % 10)}년의 전문 기사입니다. 안전하고 신속하게 이사해드리겠습니다.`,
      career: 5 + (i % 10), // 5~14년 경력
      workedCount: Math.floor(Math.random() * 100) + 10, // 10~109건 완료
      averageRating: 4.0 + Math.random() * 1.0, // 4.0~5.0 평점
      totalReviewCount: Math.floor(Math.random() * 50) + 5, // 5~54개 리뷰
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
      isVeteran: i % 5 === 0, // 20% 확률로 베테랑
    });
  }

  const users = await prisma.user.createMany({ data: userArr });
  const createdUsers = await prisma.user.findMany();
  const customerUsers = createdUsers.filter((u) =>
    u.userType.includes(UserType.CUSTOMER)
  );
  const moverUsers = createdUsers.filter((u) =>
    u.userType.includes(UserType.MOVER)
  );

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

  // ===== 시나리오별 데이터 생성 =====
  console.log("📝 시나리오별 데이터 생성 중...");

  // 오늘 날짜 설정 (2025-08-04)
  const today = new Date(2025, 7, 4, 0, 0, 0, 0); // 2025년 8월 4일
  const yesterday = new Date(2025, 7, 3, 0, 0, 0, 0); // 2025년 8월 3일

  console.log(`📅 기준 날짜: ${today.toLocaleDateString("ko-KR")}`);

  // 이사 유형들
  const moveTypes = [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE];

  // 1. 견적 요청을 보낼 수 있는 계정 10개 (PENDING 상태)
  const pendingEstimateRequests = [];

  for (let i = 0; i < 10; i++) {
    const customer = customerUsers[i];
    const moveType = moveTypes[i % moveTypes.length];

    // 고객의 주소들 가져오기
    const customerAddresses = await prisma.userAddress.findMany({
      where: { userId: customer.id },
      include: { address: true },
    });

    const fromAddress = customerAddresses.find(
      (ua) => ua.role === AddressRole.FROM
    )?.address;
    const toAddress = customerAddresses.find(
      (ua) => ua.role === AddressRole.TO
    )?.address;

    if (fromAddress && toAddress) {
      // 이사 날짜는 오늘부터 며칠 후로 설정
      const moveDate = new Date(today);
      moveDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1); // 1~14일 후

      pendingEstimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: customer.id,
            moveType: moveType,
            moveDate: moveDate,
            fromAddressId: fromAddress.id,
            toAddressId: toAddress.id,
            status: RequestStatus.PENDING,
            description: `${customer.name}님의 ${moveType === MoveType.SMALL ? "소형" : moveType === MoveType.HOME ? "가정" : "사무실"} 이사 요청입니다. 안전하고 신속한 이사 부탁드립니다.`,
          },
        })
      );
    }
  }

  const pendingRequestsResult = await Promise.all(pendingEstimateRequests);
  console.log(
    `✅ ${pendingRequestsResult.length}개의 PENDING 견적 요청 생성 완료`
  );

  // 2. 기사님들이 견적을 보낼 수 있도록 PENDING 요청에 대한 PROPOSED 견적들 생성
  const proposedEstimates = [];

  for (const request of pendingRequestsResult) {
    // 각 요청에 대해 3-5개의 기사님이 견적 제출
    const estimateCount = 3 + Math.floor(Math.random() * 3);
    const selectedMovers = moverUsers.slice(0, estimateCount);

    for (const mover of selectedMovers) {
      proposedEstimates.push(
        prisma.estimate.create({
          data: {
            moverId: mover.id,
            estimateRequestId: request.id,
            price:
              Math.floor((150000 + Math.floor(Math.random() * 350000)) / 5000) *
              5000, // 15만원 ~ 50만원
            comment: `${mover.name}입니다. ${request.moveType === MoveType.SMALL ? "소형" : request.moveType === MoveType.HOME ? "가정" : "사무실"} 이사 전문으로 안전하고 신속하게 처리해드리겠습니다!`,
            status: EstimateStatus.PROPOSED,
            workingHours: `${2 + Math.floor(Math.random() * 4)}-${4 + Math.floor(Math.random() * 4)}시간`,
            includesPackaging: Math.random() > 0.5,
            insuranceAmount: 1000000 + Math.floor(Math.random() * 2000000),
          },
        })
      );
    }
  }

  const proposedEstimatesResult = await Promise.all(proposedEstimates);
  console.log(
    `✅ ${proposedEstimatesResult.length}개의 PROPOSED 견적 생성 완료`
  );

  // 3. 이사 완료된 상태 20개 생성 (오늘 10개, 어제 10개)
  const completedEstimateRequests = [];

  // 오늘 완료된 이사 10개
  for (let i = 0; i < 10; i++) {
    const customer = customerUsers[i];
    const mover = moverUsers[i];
    const moveType = moveTypes[i % moveTypes.length];

    const customerAddresses = await prisma.userAddress.findMany({
      where: { userId: customer.id },
      include: { address: true },
    });

    const fromAddress = customerAddresses.find(
      (ua) => ua.role === AddressRole.FROM
    )?.address;
    const toAddress = customerAddresses.find(
      (ua) => ua.role === AddressRole.TO
    )?.address;

    if (fromAddress && toAddress) {
      completedEstimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: customer.id,
            moveType: moveType,
            moveDate: today,
            fromAddressId: fromAddress.id,
            toAddressId: toAddress.id,
            status: RequestStatus.COMPLETED,
            description: `${customer.name}님의 ${moveType === MoveType.SMALL ? "소형" : moveType === MoveType.HOME ? "가정" : "사무실"} 이사가 완료되었습니다.`,
          },
        })
      );
    }
  }

  // 어제 완료된 이사 10개
  for (let i = 0; i < 10; i++) {
    const customer = customerUsers[i];
    const mover = moverUsers[(i + 5) % 10]; // 다른 기사님과 매칭
    const moveType = moveTypes[(i + 1) % moveTypes.length];

    const customerAddresses = await prisma.userAddress.findMany({
      where: { userId: customer.id },
      include: { address: true },
    });

    const fromAddress = customerAddresses.find(
      (ua) => ua.role === AddressRole.FROM
    )?.address;
    const toAddress = customerAddresses.find(
      (ua) => ua.role === AddressRole.TO
    )?.address;

    if (fromAddress && toAddress) {
      completedEstimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: customer.id,
            moveType: moveType,
            moveDate: yesterday,
            fromAddressId: fromAddress.id,
            toAddressId: toAddress.id,
            status: RequestStatus.COMPLETED,
            description: `${customer.name}님의 ${moveType === MoveType.SMALL ? "소형" : moveType === MoveType.HOME ? "가정" : "사무실"} 이사가 완료되었습니다.`,
          },
        })
      );
    }
  }

  const completedRequestsResult = await Promise.all(completedEstimateRequests);
  console.log(
    `✅ ${completedRequestsResult.length}개의 COMPLETED 견적 요청 생성 완료`
  );

  // 4. 완료된 요청들에 대한 ACCEPTED 견적들 생성
  const acceptedEstimates = [];

  for (let i = 0; i < completedRequestsResult.length; i++) {
    const request = completedRequestsResult[i];
    const mover = moverUsers[i % 10];

    acceptedEstimates.push(
      prisma.estimate.create({
        data: {
          moverId: mover.id,
          estimateRequestId: request.id,
          price:
            Math.floor((200000 + Math.floor(Math.random() * 300000)) / 5000) *
            5000, // 20만원 ~ 50만원
          comment: `${mover.name}입니다. 안전하고 신속하게 이사 완료했습니다!`,
          status: EstimateStatus.ACCEPTED,
          workingHours: `${3 + Math.floor(Math.random() * 3)}-${5 + Math.floor(Math.random() * 3)}시간`,
          includesPackaging: Math.random() > 0.3,
          insuranceAmount: 1000000 + Math.floor(Math.random() * 2000000),
        },
      })
    );
  }

  const acceptedEstimatesResult = await Promise.all(acceptedEstimates);
  console.log(
    `✅ ${acceptedEstimatesResult.length}개의 ACCEPTED 견적 생성 완료`
  );

  // 5. 완료된 이사에 대한 리뷰 생성 (리뷰 가능한 상태)
  const completedReviews = [];

  for (let i = 0; i < completedRequestsResult.length; i++) {
    const request = completedRequestsResult[i];
    const acceptedEstimate = acceptedEstimatesResult[i];

    const reviewContents = [
      "정말 친절하고 신속하게 이사해주셨습니다. 추천합니다!",
      "물건 하나하나 조심스럽게 다뤄주셔서 감사했습니다.",
      "시간 약속도 잘 지키시고 깔끔하게 처리해주셨어요.",
      "가격도 합리적이고 서비스도 만족스러웠습니다.",
      "다음에도 꼭 부탁드리고 싶은 기사님이에요!",
      "포장도 꼼꼼히 해주시고 배치도 잘 해주셨습니다.",
      "무거운 가구도 안전하게 옮겨주셔서 고마웠어요.",
      "예상보다 빨리 끝나서 좋았습니다. 실력이 좋으세요!",
    ];

    completedReviews.push(
      prisma.review.create({
        data: {
          customerId: request.customerId,
          moverId: acceptedEstimate.moverId,
          estimateRequestId: request.id,
          rating: 4 + Math.floor(Math.random() * 2), // 4~5점
          content: reviewContents[i % reviewContents.length],
          status: ReviewStatus.COMPLETED,
        },
      })
    );
  }

  const reviewsResult = await Promise.all(completedReviews);
  console.log(`✅ ${reviewsResult.length}개의 리뷰 생성 완료`);

  console.log("📊 시나리오별 데이터 생성 완료!");
  console.log(`📝 견적 요청 가능한 고객: 10명`);
  console.log(`🚚 견적 제출 가능한 기사: 10명`);
  console.log(
    `✅ 오늘(${today.toLocaleDateString("ko-KR")}) 완료된 이사: 10개`
  );
  console.log(
    `✅ 어제(${yesterday.toLocaleDateString("ko-KR")}) 완료된 이사: 10개`
  );
  console.log(`⭐ 리뷰 작성 완료: ${reviewsResult.length}개`);

  // 기사님 통계 업데이트
  const moverStatsUpdate: {
    [key: string]: {
      reviewCount: number;
      totalRating: number;
      workedCount: number;
    };
  } = {};

  // 리뷰 데이터로 통계 계산
  for (const review of reviewsResult) {
    const moverId = review.moverId;
    if (!moverStatsUpdate[moverId]) {
      moverStatsUpdate[moverId] = {
        reviewCount: 0,
        totalRating: 0,
        workedCount: 0,
      };
    }
    moverStatsUpdate[moverId].reviewCount++;
    moverStatsUpdate[moverId].totalRating += review.rating;
  }

  // 확정된 견적 수 계산 (ACCEPTED 상태인 견적들)
  for (const estimate of acceptedEstimatesResult) {
    const moverId = estimate.moverId;
    if (!moverStatsUpdate[moverId]) {
      moverStatsUpdate[moverId] = {
        reviewCount: 0,
        totalRating: 0,
        workedCount: 0,
      };
    }
    moverStatsUpdate[moverId].workedCount++;
  }

  // 각 기사의 통계 업데이트
  for (const [moverId, stats] of Object.entries(moverStatsUpdate)) {
    await prisma.user.update({
      where: { id: moverId },
      data: {
        totalReviewCount: stats.reviewCount,
        averageRating:
          stats.reviewCount > 0 ? stats.totalRating / stats.reviewCount : 0,
        workedCount: stats.workedCount,
      },
    });
  }

  // 찜 생성 (고객 10명 -> 기사 10명)
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
  for (let i = 0; i < 5; i++) {
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
      })
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
      })
    );
  }

  // 2. ESTIMATE_REQUEST_CREATE 액션들
  for (let i = 0; i < 3; i++) {
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
      })
    );
  }

  // 3. ESTIMATE_SUBMITTED 액션들
  for (let i = 0; i < 3; i++) {
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
      })
    );
  }

  // 4. ESTIMATE_ACCEPTED 액션들
  for (let i = 0; i < 3; i++) {
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
      })
    );
  }

  // 5. ESTIMATE_REJECTED 액션들
  for (let i = 0; i < 2; i++) {
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
      })
    );
  }

  // 6. REVIEW_SUBMITTED 액션들
  for (let i = 0; i < 3; i++) {
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
      })
    );
  }

  // 7. FAVORITE_ADDED 액션들
  for (let i = 0; i < 3; i++) {
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
      })
    );
  }

  // 8. FAVORITE_REMOVED 액션들
  for (let i = 0; i < 2; i++) {
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
      })
    );
  }

  // 9. MOVE_DAY_REMINDER 액션들
  for (let i = 0; i < 2; i++) {
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
      })
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
      })
    );
  }

  // 10. MOVE_DAY_REVIEW_REQUEST 액션들
  for (let i = 0; i < 2; i++) {
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
      })
    );
  }

  const actionsResult = await Promise.all(actions);
  console.log(`✅ ${actionsResult.length}개의 액션 생성 완료`);

  console.log("✅ 시드 데이터 생성 완료! (10명 단위)");
  console.log(`👤 생성된 사용자: ${users.count}명 (고객 10명, 기사 10명)`);
  console.log(`🏠 생성된 주소: ${addresses.length}개`);
  console.log(`📝 PENDING 견적 요청: ${pendingRequestsResult.length}개`);
  console.log(`🚚 PROPOSED 견적: ${proposedEstimatesResult.length}개`);
  console.log(`✅ COMPLETED 견적 요청: ${completedRequestsResult.length}개`);
  console.log(`💰 ACCEPTED 견적: ${acceptedEstimatesResult.length}개`);
  console.log(`⭐ 생성된 리뷰: ${reviewsResult.length}개`);
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

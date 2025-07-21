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

  // 주소 데이터 생성
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        postalCode: "06123",
        city: "강남구",
        district: "역삼동",
        detail: "테헤란로 123",
        region: RegionType.SEOUL,
      },
    }),
    prisma.address.create({
      data: {
        postalCode: "06124",
        city: "강남구",
        district: "역삼동",
        detail: "테헤란로 456",
        region: RegionType.SEOUL,
      },
    }),
    prisma.address.create({
      data: {
        postalCode: "06234",
        city: "서초구",
        district: "서초동",
        detail: "서초대로 789",
        region: RegionType.SEOUL,
      },
    }),
    prisma.address.create({
      data: {
        postalCode: "13529",
        city: "성남시 분당구",
        district: "정자동",
        detail: "판교로 321",
        region: RegionType.GYEONGGI,
      },
    }),
    prisma.address.create({
      data: {
        postalCode: "13530",
        city: "성남시 분당구",
        district: "정자동",
        detail: "판교로 654",
        region: RegionType.GYEONGGI,
      },
    }),
  ]);

  // 사용자 데이터 생성
  const users = await Promise.all([
    // 고객들
    prisma.user.create({
      data: {
        email: "customer1@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-1234-5678"),
        name: "김고객",
        userType: [UserType.CUSTOMER],
        provider: AuthProvider.LOCAL,
        customerImage: "https://example.com/customer1.jpg",
        nickname: "이사고객1",
        currentArea: RegionType.SEOUL,
        preferredServices: [MoveType.HOME, MoveType.SMALL],
      },
    }),
    prisma.user.create({
      data: {
        email: "customer2@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-2345-6789"),
        name: "이고객",
        userType: [UserType.CUSTOMER],
        provider: AuthProvider.LOCAL,
        customerImage: "https://example.com/customer2.jpg",
        nickname: "이사고객2",
        currentArea: RegionType.GYEONGGI,
        preferredServices: [MoveType.OFFICE],
      },
    }),
    prisma.user.create({
      data: {
        email: "customer3@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-3456-7890"),
        name: "박고객",
        userType: [UserType.CUSTOMER],
        provider: AuthProvider.GOOGLE,
        providerId: "google123",
        customerImage: "https://example.com/customer3.jpg",
        nickname: "이사고객3",
        currentArea: RegionType.SEOUL,
        preferredServices: [MoveType.HOME],
      },
    }),

    // 고객이면서 기사님도 하는 사용자 (이중 역할)
    prisma.user.create({
      data: {
        email: "hybrid1@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-4444-5555"),
        name: "최하이브리드",
        userType: [UserType.CUSTOMER, UserType.MOVER], // 둘 다 가능
        provider: AuthProvider.LOCAL,
        customerImage: "https://example.com/hybrid1_customer.jpg",
        moverImage: "https://example.com/hybrid1_mover.jpg",
        nickname: "하이브리드전문가",
        currentArea: RegionType.GYEONGGI,
        preferredServices: [MoveType.SMALL, MoveType.HOME],
        isVeteran: true,
        shortIntro: "고객이면서 기사님도 하는 하이브리드 전문가",
        detailIntro: "고객의 입장을 잘 아는 기사님입니다. 고객이 원하는 서비스를 정확히 제공해드립니다.",
        career: 5,
        workedCount: 45,
        averageRating: 4.9,
        totalReviewCount: 42,
        serviceTypes: [MoveType.SMALL, MoveType.HOME],
      },
    }),

    // 기사님들
    prisma.user.create({
      data: {
        email: "mover1@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-1111-2222"),
        name: "김기사",
        userType: [UserType.MOVER],
        provider: AuthProvider.LOCAL,
        moverImage: "https://example.com/mover1.jpg",
        nickname: "베테랑기사",
        currentArea: RegionType.SEOUL,
        isVeteran: true,
        shortIntro: "10년 경력의 베테랑 기사입니다",
        detailIntro:
          "소형이사부터 사무실이사까지 모든 이사를 전문적으로 처리합니다. 안전하고 신속한 서비스를 제공합니다.",
        career: 10,
        workedCount: 150,
        averageRating: 4.8,
        totalReviewCount: 120,
        serviceTypes: [MoveType.SMALL, MoveType.HOME, MoveType.OFFICE],
      },
    }),
    prisma.user.create({
      data: {
        email: "mover2@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-2222-3333"),
        name: "이기사",
        userType: [UserType.MOVER],
        provider: AuthProvider.LOCAL,
        moverImage: "https://example.com/mover2.jpg",
        nickname: "신입기사",
        currentArea: RegionType.SEOUL,
        isVeteran: false,
        shortIntro: "신입이지만 열정만큼은 누구보다 강합니다",
        detailIntro: "신입 기사이지만 고객 만족을 위해 최선을 다하겠습니다. 합리적인 가격으로 서비스를 제공합니다.",
        career: 1,
        workedCount: 5,
        averageRating: 4.2,
        totalReviewCount: 5,
        serviceTypes: [MoveType.SMALL, MoveType.HOME],
      },
    }),
    prisma.user.create({
      data: {
        email: "mover3@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-3333-4444"),
        name: "박기사",
        userType: [UserType.MOVER],
        provider: AuthProvider.KAKAO,
        providerId: "kakao123",
        moverImage: "https://example.com/mover3.jpg",
        nickname: "전문기사",
        currentArea: RegionType.GYEONGGI,
        isVeteran: true,
        shortIntro: "사무실 이사 전문 기사입니다",
        detailIntro: "사무실 이사에 특화된 전문 기사입니다. 사무용품과 장비의 안전한 이전을 보장합니다.",
        career: 8,
        workedCount: 80,
        averageRating: 4.6,
        totalReviewCount: 75,
        serviceTypes: [MoveType.OFFICE, MoveType.HOME],
      },
    }),
  ]);

  const [customer1, customer2, customer3, hybridUser, mover1, mover2, mover3] = users;

  // 기사님 서비스 지역 설정
  await Promise.all([
    prisma.moverServiceArea.create({
      data: {
        userId: mover1.id,
        region: RegionType.SEOUL,
        district: "강남구",
      },
    }),
    prisma.moverServiceArea.create({
      data: {
        userId: mover1.id,
        region: RegionType.SEOUL,
        district: "서초구",
      },
    }),
    prisma.moverServiceArea.create({
      data: {
        userId: mover2.id,
        region: RegionType.SEOUL,
        district: "강남구",
      },
    }),
    prisma.moverServiceArea.create({
      data: {
        userId: mover3.id,
        region: RegionType.GYEONGGI,
        district: "성남시 분당구",
      },
    }),
    // 하이브리드 기사님 서비스 지역
    prisma.moverServiceArea.create({
      data: {
        userId: hybridUser.id,
        region: RegionType.GYEONGGI,
        district: "성남시 분당구",
      },
    }),
    prisma.moverServiceArea.create({
      data: {
        userId: hybridUser.id,
        region: RegionType.SEOUL,
        district: "강남구",
      },
    }),
  ]);

  // 사용자별 주소 등록
  await Promise.all([
    prisma.userAddress.create({
      data: {
        userId: customer1.id,
        addressId: addresses[0].id,
        role: AddressRole.FROM,
        customLabel: "현재 집",
      },
    }),
    prisma.userAddress.create({
      data: {
        userId: customer1.id,
        addressId: addresses[1].id,
        role: AddressRole.TO,
        customLabel: "새 집",
      },
    }),
    prisma.userAddress.create({
      data: {
        userId: customer2.id,
        addressId: addresses[2].id,
        role: AddressRole.FROM,
        customLabel: "회사",
      },
    }),
    prisma.userAddress.create({
      data: {
        userId: customer2.id,
        addressId: addresses[3].id,
        role: AddressRole.TO,
        customLabel: "새 사무실",
      },
    }),
  ]);

  // 견적 요청 생성
  const estimateRequests = await Promise.all([
    prisma.estimateRequest.create({
      data: {
        customerId: customer1.id,
        moveType: MoveType.HOME,
        moveDate: new Date("2024-02-15"),
        fromAddressId: addresses[0].id,
        toAddressId: addresses[1].id,
        status: RequestStatus.COMPLETED,
        description: "1인 가구 소형 이사입니다. 가전제품과 옷장 정도만 있습니다.",
      },
    }),
    prisma.estimateRequest.create({
      data: {
        customerId: customer2.id,
        moveType: MoveType.OFFICE,
        moveDate: new Date("2024-02-20"),
        fromAddressId: addresses[2].id,
        toAddressId: addresses[3].id,
        status: RequestStatus.PENDING,
        description: "소규모 사무실 이사입니다. 책상 5개와 서랍장 2개 정도입니다.",
      },
    }),
    prisma.estimateRequest.create({
      data: {
        customerId: customer3.id,
        moveType: MoveType.HOME,
        moveDate: new Date("2024-02-25"),
        fromAddressId: addresses[0].id,
        toAddressId: addresses[4].id,
        status: RequestStatus.APPROVED,
        description: "가족 이사입니다. 가전제품과 가구가 많습니다.",
      },
    }),
    // 하이브리드 사용자의 견적 요청
    prisma.estimateRequest.create({
      data: {
        customerId: hybridUser.id,
        moveType: MoveType.SMALL,
        moveDate: new Date("2024-03-01"),
        fromAddressId: addresses[3].id,
        toAddressId: addresses[0].id,
        status: RequestStatus.PENDING,
        description: "하이브리드 사용자의 소형 이사 요청입니다. 고객이면서 기사님도 하는 사용자입니다.",
      },
    }),
  ]);

  const [request1, request2, request3, request4] = estimateRequests;

  // 견적 생성
  const estimates = await Promise.all([
    prisma.estimate.create({
      data: {
        moverId: mover1.id,
        estimateRequestId: request1.id,
        price: 150000,
        comment: "안전하고 신속하게 처리해드리겠습니다.",
        status: EstimateStatus.ACCEPTED,
        workingHours: "3-4시간",
        includesPackaging: true,
        insuranceAmount: 5000000,
      },
    }),
    prisma.estimate.create({
      data: {
        moverId: mover2.id,
        estimateRequestId: request1.id,
        price: 120000,
        comment: "합리적인 가격으로 서비스 제공합니다.",
        status: EstimateStatus.REJECTED,
        workingHours: "4-5시간",
        includesPackaging: false,
        insuranceAmount: 3000000,
      },
    }),
    prisma.estimate.create({
      data: {
        moverId: mover3.id,
        estimateRequestId: request2.id,
        price: 300000,
        comment: "사무실 이사 전문으로 처리해드립니다.",
        status: EstimateStatus.PROPOSED,
        workingHours: "6-8시간",
        includesPackaging: true,
        insuranceAmount: 10000000,
      },
    }),
    // 하이브리드 사용자가 제출한 견적
    prisma.estimate.create({
      data: {
        moverId: hybridUser.id,
        estimateRequestId: request4.id,
        price: 80000,
        comment: "고객의 입장을 잘 아는 기사님입니다. 합리적인 가격으로 서비스 제공합니다.",
        status: EstimateStatus.PROPOSED,
        workingHours: "2-3시간",
        includesPackaging: true,
        insuranceAmount: 2000000,
      },
    }),
    // 다른 기사님이 하이브리드 사용자의 요청에 제출한 견적
    prisma.estimate.create({
      data: {
        moverId: mover1.id,
        estimateRequestId: request4.id,
        price: 100000,
        comment: "하이브리드 고객님의 요청에 견적 제출합니다.",
        status: EstimateStatus.PROPOSED,
        workingHours: "3-4시간",
        includesPackaging: false,
        insuranceAmount: 3000000,
      },
    }),
  ]);

  // 리뷰 생성
  await prisma.review.create({
    data: {
      customerId: customer1.id,
      moverId: mover1.id,
      estimateRequestId: request1.id,
      rating: 5,
      content: "정말 만족스러운 서비스였습니다. 기사님이 친절하고 안전하게 처리해주셨습니다.",
    },
  });

  // 찜 기능
  await Promise.all([
    prisma.favorite.create({
      data: {
        customerId: customer1.id,
        moverId: mover1.id,
      },
    }),
    prisma.favorite.create({
      data: {
        customerId: customer2.id,
        moverId: mover3.id,
      },
    }),
    prisma.favorite.create({
      data: {
        customerId: customer3.id,
        moverId: mover1.id,
      },
    }),
    // 하이브리드 사용자의 찜
    prisma.favorite.create({
      data: {
        customerId: hybridUser.id,
        moverId: mover1.id,
      },
    }),
    // 다른 고객이 하이브리드 기사님을 찜
    prisma.favorite.create({
      data: {
        customerId: customer1.id,
        moverId: hybridUser.id,
      },
    }),
  ]);

  // 사용자 활동 생성
  const actions = await Promise.all([
    prisma.action.create({
      data: {
        userId: customer1.id,
        type: ActionType.ESTIMATE_REQUEST_CREATE,
        entityId: request1.id,
        entityType: "EstimateRequest",
        description: "견적 요청을 생성했습니다.",
      },
    }),
    prisma.action.create({
      data: {
        userId: mover1.id,
        type: ActionType.ESTIMATE_SUBMITTED,
        entityId: estimates[0].id,
        entityType: "Estimate",
        description: "견적을 제출했습니다.",
      },
    }),
    prisma.action.create({
      data: {
        userId: customer1.id,
        type: ActionType.ESTIMATE_ACCEPTED,
        entityId: estimates[0].id,
        entityType: "Estimate",
        description: "견적을 수락했습니다.",
      },
    }),
  ]);

  // 알림 생성
  await Promise.all([
    prisma.notification.create({
      data: {
        actionId: actions[1].id,
        userId: customer1.id,
        type: NotificationType.ESTIMATE_ARRIVED,
        title: "새로운 견적이 도착했습니다",
        content: "김기사님이 견적을 제출했습니다.",
        path: `/estimates/${estimates[0].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        actionId: actions[2].id,
        userId: mover1.id,
        type: NotificationType.ESTIMATE_STATUS_UPDATED,
        title: "견적이 수락되었습니다",
        content: "고객님이 견적을 수락했습니다.",
        path: `/estimates/${estimates[0].id}`,
      },
    }),
  ]);

  console.log("✅ Seed completed successfully!");
  console.log(`📊 Created ${users.length} users (including hybrid user)`);
  console.log(`🏠 Created ${addresses.length} addresses`);
  console.log(`📋 Created ${estimateRequests.length} estimate requests`);
  console.log(`💰 Created ${estimates.length} estimates`);
  console.log(`🎭 Hybrid user: ${hybridUser.name} (Customer: ${hybridUser.email}, Mover: ${hybridUser.email})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

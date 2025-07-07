import {
  PrismaClient,
  UserType,
  MovingType,
  QuoteStatus,
  RequestStatus,
  ReviewStatus,
  SocialProvider,
  Region,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import { encryptPhoneNumber } from "../../utils/phoneEncryption";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 시드 데이터 생성을 시작합니다...");

  // 1. 서비스 데이터 생성
  console.log("🔧 서비스 데이터 생성 중...");
  const services = await prisma.service.createMany({
    data: [
      {
        name: "소형이사",
        description: "원룸, 투룸 등 소규모 이사",
        isActive: true,
        iconUrl: "https://s3.amazonaws.com/moving-icons/small-moving.svg",
      },
      {
        name: "가정이사",
        description: "일반 가정용 이사",
        isActive: true,
        iconUrl: "https://s3.amazonaws.com/moving-icons/home-moving.svg",
      },
      {
        name: "사무실이사",
        description: "사무실 및 오피스 이사",
        isActive: true,
        iconUrl: "https://s3.amazonaws.com/moving-icons/office-moving.svg",
      },
    ],
  });

  // 생성된 서비스 조회
  const createdServices = await prisma.service.findMany();

  // 2. 사용자 데이터 생성 (고객)
  console.log("👥 고객 사용자 데이터 생성 중...");
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: "customer1@example.com",
        name: "김고객",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-1234-5678"),
        currentRole: UserType.CUSTOMER,
        hasProfile: false,
        currentRegion: Region.SEOUL, // enum 직접 사용
        lastLoginAt: new Date(),
        userRoles: {
          create: {
            role: UserType.CUSTOMER,
            isActive: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "customer2@example.com",
        name: "박고객",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-2345-6789"),
        currentRole: UserType.CUSTOMER,
        hasProfile: false,
        currentRegion: Region.GYEONGGI, // enum 직접 사용
        lastLoginAt: new Date(),
        userRoles: {
          create: {
            role: UserType.CUSTOMER,
            isActive: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "customer3@example.com",
        name: "이고객",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-3456-7890"),
        currentRole: UserType.CUSTOMER,
        hasProfile: false,
        currentRegion: Region.INCHEON, // enum 직접 사용
        lastLoginAt: new Date(),
        userRoles: {
          create: {
            role: UserType.CUSTOMER,
            isActive: true,
          },
        },
      },
    }),
  ]);

  // 3. 기사님 사용자 데이터 생성
  console.log("🚛 기사님 사용자 데이터 생성 중...");
  const movers = await Promise.all([
    prisma.user.create({
      data: {
        email: "mover1@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-4567-8901"),
        currentRole: UserType.MOVER,
        hasProfile: true,
        lastLoginAt: new Date(),
        userRoles: {
          create: {
            role: UserType.MOVER,
            isActive: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "mover2@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-5678-9012"),
        currentRole: UserType.MOVER,
        hasProfile: true,
        lastLoginAt: new Date(),
        userRoles: {
          create: {
            role: UserType.MOVER,
            isActive: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "mover3@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-6789-0123"),
        currentRole: UserType.MOVER,
        hasProfile: true,
        lastLoginAt: new Date(),
        userRoles: {
          create: {
            role: UserType.MOVER,
            isActive: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "mover4@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-7890-1234"),
        currentRole: UserType.MOVER,
        hasProfile: true,
        lastLoginAt: new Date(),
        userRoles: {
          create: {
            role: UserType.MOVER,
            isActive: true,
          },
        },
      },
    }),
  ]);

  // 4. 기사님 프로필 데이터 생성 (통계 데이터 포함)
  console.log("📝 기사님 프로필 데이터 생성 중...");
  const profiles = await Promise.all([
    prisma.profile.create({
      data: {
        userId: movers[0].id,
        nickname: "믿을만한김기사",
        profileImage: "https://s3.amazonaws.com/profiles/profile1.jpg",
        experience: 5,
        introduction: "5년 경력의 꼼꼼한 이사 전문가입니다",
        description: "안전하고 신속한 이사를 약속드립니다. 고객 만족도 98%를 자랑하는 전문 기사입니다.",
        completedCount: 136,
        avgRating: 5.0,
        reviewCount: 128,
        favoriteCount: 45,
        lastActivityAt: new Date(),
      },
    }),
    prisma.profile.create({
      data: {
        userId: movers[1].id,
        nickname: "신속한박기사",
        profileImage: "https://s3.amazonaws.com/profiles/profile2.jpg",
        experience: 8,
        introduction: "8년 경력의 신속한 이사 서비스",
        description: "빠르고 정확한 이사로 고객님의 시간을 절약해드립니다. 대형 이사도 전문적으로 처리합니다.",
        completedCount: 334,
        avgRating: 4.8,
        reviewCount: 298,
        favoriteCount: 67,
        lastActivityAt: new Date(),
      },
    }),
    prisma.profile.create({
      data: {
        userId: movers[2].id,
        nickname: "친절한이기사",
        profileImage: "https://s3.amazonaws.com/profiles/profile3.jpg",
        experience: 3,
        introduction: "고객 서비스 최우선 3년차 기사",
        description: "고객님의 소중한 물건을 내 것처럼 소중히 다뤄드립니다. 친절한 서비스가 저의 장점입니다.",
        completedCount: 78,
        avgRating: 4.9,
        reviewCount: 72,
        favoriteCount: 23,
        lastActivityAt: new Date(),
      },
    }),
    prisma.profile.create({
      data: {
        userId: movers[3].id,
        nickname: "전문가최기사",
        profileImage: "https://s3.amazonaws.com/profiles/profile4.jpg",
        experience: 12,
        introduction: "12년 경력의 이사 전문가",
        description: "어떤 이사든 완벽하게 처리해드립니다. 장거리 이사와 특수 물품 운반도 전문적으로 해드립니다.",
        completedCount: 512,
        avgRating: 4.7,
        reviewCount: 489,
        favoriteCount: 89,
        lastActivityAt: new Date(),
      },
    }),
  ]);

  // 5. 기사님 서비스 지역 설정 (enum 직접 사용)
  console.log("🗺️ 기사님 서비스 지역 설정 중...");
  await prisma.profileRegion.createMany({
    data: [
      // 김기사 - 서울, 경기
      { profileId: profiles[0].id, region: Region.SEOUL },
      { profileId: profiles[0].id, region: Region.GYEONGGI },

      // 박기사 - 서울, 인천, 경기
      { profileId: profiles[1].id, region: Region.SEOUL },
      { profileId: profiles[1].id, region: Region.INCHEON },
      { profileId: profiles[1].id, region: Region.GYEONGGI },

      // 이기사 - 부산, 경상남도
      { profileId: profiles[2].id, region: Region.BUSAN },
      { profileId: profiles[2].id, region: Region.GYEONGNAM },

      // 최기사 - 전국 서비스
      { profileId: profiles[3].id, region: Region.SEOUL },
      { profileId: profiles[3].id, region: Region.BUSAN },
      { profileId: profiles[3].id, region: Region.DAEGU },
      { profileId: profiles[3].id, region: Region.GYEONGGI },
    ],
  });

  // 6. 기사님 서비스 종류 설정
  console.log("🔧 기사님 서비스 종류 설정 중...");
  await prisma.profileService.createMany({
    data: [
      // 김기사 - 소형이사, 가정이사
      { profileId: profiles[0].id, serviceId: createdServices[0].id },
      { profileId: profiles[0].id, serviceId: createdServices[1].id },

      // 박기사 - 모든 서비스
      { profileId: profiles[1].id, serviceId: createdServices[0].id },
      { profileId: profiles[1].id, serviceId: createdServices[1].id },
      { profileId: profiles[1].id, serviceId: createdServices[2].id },

      // 이기사 - 소형이사, 가정이사
      { profileId: profiles[2].id, serviceId: createdServices[0].id },
      { profileId: profiles[2].id, serviceId: createdServices[1].id },

      // 최기사 - 가정이사, 사무실이사
      { profileId: profiles[3].id, serviceId: createdServices[1].id },
      { profileId: profiles[3].id, serviceId: createdServices[2].id },
    ],
  });

  // 7. 이사 요청 데이터 생성 (enum 직접 사용)
  console.log("📦 이사 요청 데이터 생성 중...");
  const movingRequests = await Promise.all([
    prisma.movingRequest.create({
      data: {
        userId: customers[0].id,
        movingType: MovingType.SMALL,
        movingDate: new Date("2024-02-15"),
        departureAddr: "서울시 강남구 역삼동 123-45",
        arrivalAddr: "서울시 서초구 서초동 678-90",
        departureDetail: "3층 원룸",
        arrivalDetail: "2층 투룸",
        departureRegion: Region.SEOUL, // enum 직접 사용
        arrivalRegion: Region.SEOUL, // enum 직접 사용
        description: "냉장고와 세탁기 운반 주의 필요",
        status: RequestStatus.ACTIVE,
        estimatedDistance: 5.2,
        floor: 3,
        hasElevator: false,
        quoteCount: 2,
        isUrgent: false,
        maxBudget: 200000,
      },
    }),
    prisma.movingRequest.create({
      data: {
        userId: customers[1].id,
        movingType: MovingType.HOME,
        movingDate: new Date("2024-02-20"),
        departureAddr: "경기도 성남시 분당구 정자동 456-78",
        arrivalAddr: "서울시 송파구 잠실동 789-01",
        departureDetail: "아파트 15층",
        arrivalDetail: "아파트 8층",
        departureRegion: Region.GYEONGGI, // enum 직접 사용
        arrivalRegion: Region.SEOUL, // enum 직접 사용
        description: "피아노 운반 포함, 엘리베이터 사용 가능",
        status: RequestStatus.CONFIRMED,
        estimatedDistance: 25.8,
        floor: 15,
        hasElevator: true,
        quoteCount: 3,
        isUrgent: true,
        maxBudget: 500000,
      },
    }),
    prisma.movingRequest.create({
      data: {
        userId: customers[2].id,
        movingType: MovingType.OFFICE,
        movingDate: new Date("2024-02-25"),
        departureAddr: "서울시 중구 명동 234-56",
        arrivalAddr: "서울시 영등포구 여의도 567-89",
        departureDetail: "오피스텔 12층",
        arrivalDetail: "오피스빌딩 20층",
        departureRegion: Region.SEOUL, // enum 직접 사용
        arrivalRegion: Region.SEOUL, // enum 직접 사용
        description: "사무용 컴퓨터 및 서류 다수, 주말 이사 희망",
        status: RequestStatus.ACTIVE,
        estimatedDistance: 8.3,
        floor: 12,
        hasElevator: true,
        quoteCount: 1,
        isUrgent: false,
        maxBudget: 1000000,
      },
    }),
  ]);

  // 8. 견적 데이터 생성 (편의 필드 포함)
  console.log("💰 견적 데이터 생성 중...");
  const quotes = await Promise.all([
    // 첫 번째 요청에 대한 견적들
    prisma.quote.create({
      data: {
        requestId: movingRequests[0].id,
        moverId: movers[0].id,
        price: 150000,
        description: "소형이사 전문 서비스입니다. 냉장고, 세탁기 안전 운반 보장",
        status: QuoteStatus.SENT,
        validUntil: new Date("2024-02-10"),
        responseTime: 30, // 30분 후 응답
        workingHours: "3-4시간",
        includesPackaging: true,
        insuranceAmount: 1000000,
      },
    }),
    prisma.quote.create({
      data: {
        requestId: movingRequests[0].id,
        moverId: movers[1].id,
        price: 180000,
        description: "신속하고 안전한 이사 서비스. 포장재 무료 제공",
        status: QuoteStatus.SENT,
        validUntil: new Date("2024-02-10"),
        responseTime: 15, // 15분 후 응답
        workingHours: "2-3시간",
        includesPackaging: true,
        insuranceAmount: 1500000,
      },
    }),

    // 두 번째 요청에 대한 견적들
    prisma.quote.create({
      data: {
        requestId: movingRequests[1].id,
        moverId: movers[1].id,
        price: 450000,
        description: "피아노 전문 운반 서비스 포함. 보험 적용",
        status: QuoteStatus.ACCEPTED,
        validUntil: new Date("2024-02-15"),
        responseTime: 45, // 45분 후 응답
        workingHours: "5-6시간",
        includesPackaging: true,
        insuranceAmount: 5000000,
      },
    }),
    prisma.quote.create({
      data: {
        requestId: movingRequests[1].id,
        moverId: movers[3].id,
        price: 500000,
        description: "12년 경력 전문가의 완벽한 가정이사 서비스",
        status: QuoteStatus.SENT,
        validUntil: new Date("2024-02-15"),
        responseTime: 120, // 2시간 후 응답
        workingHours: "4-5시간",
        includesPackaging: true,
        insuranceAmount: 10000000,
      },
    }),

    // 세 번째 요청에 대한 견적
    prisma.quote.create({
      data: {
        requestId: movingRequests[2].id,
        moverId: movers[3].id,
        price: 800000,
        description: "사무실 이사 전문. IT 장비 안전 운반 및 설치 지원",
        status: QuoteStatus.SENT,
        validUntil: new Date("2024-02-20"),
        responseTime: 60, // 1시간 후 응답
        workingHours: "6-8시간",
        includesPackaging: false,
        insuranceAmount: 20000000,
      },
    }),
  ]);

  // 9. 확정된 견적 업데이트
  console.log("✅ 확정된 견적 업데이트 중...");
  await prisma.movingRequest.update({
    where: { id: movingRequests[1].id },
    data: {
      confirmedQuoteId: quotes[2].id,
      status: RequestStatus.CONFIRMED,
    },
  });

  // 10. 리뷰 데이터 생성
  console.log("📝 리뷰 데이터 생성 중...");
  await Promise.all([
    prisma.review.create({
      data: {
        requestId: movingRequests[1].id,
        quoteId: quotes[2].id,
        userId: customers[1].id,
        moverId: movers[1].id,
        rating: 5,
        content:
          "정말 친절하고 꼼꼼하게 이사해주셨어요! 피아노도 안전하게 운반해주시고 시간도 정확하게 지켜주셨습니다.",
        status: ReviewStatus.COMPLETED,
        isPublic: true,
      },
    }),
  ]);

  // 11. 찜하기 데이터
  console.log("❤️ 찜하기 데이터 생성 중...");
  await prisma.favorite.createMany({
    data: [
      { userId: customers[0].id, moverId: movers[0].id },
      { userId: customers[0].id, moverId: movers[1].id },
      { userId: customers[1].id, moverId: movers[3].id },
      { userId: customers[2].id, moverId: movers[1].id },
    ],
  });

  // 12. 소셜 계정 데이터
  console.log("📱 소셜 계정 데이터 생성 중...");
  await prisma.socialAccount.createMany({
    data: [
      {
        provider: SocialProvider.KAKAO,
        providerId: "kakao_123456",
        userId: customers[1].id,
      },
      {
        provider: SocialProvider.GOOGLE,
        providerId: "google_789012",
        userId: customers[2].id,
      },
      {
        provider: SocialProvider.NAVER,
        providerId: "naver_345678",
        userId: movers[2].id,
      },
    ],
  });

  // 13. 일반 유저 서비스 선택 데이터
  console.log("🔧 일반 유저 서비스 선택 데이터 생성 중...");
  await prisma.userService.createMany({
    data: [
      { userId: customers[0].id, serviceId: createdServices[0].id }, // 소형이사
      { userId: customers[1].id, serviceId: createdServices[1].id }, // 가정이사
      { userId: customers[2].id, serviceId: createdServices[2].id }, // 사무실이사
    ],
  });

  console.log("✨ 시드 데이터 생성이 완료되었습니다!");
  console.log(`
  📊 생성된 데이터 요약:
  - 서비스: 3개 (소형/가정/사무실)
  - 고객: 3명
  - 기사님: 4명 (통계 데이터 포함)
  - 프로필: 4개
  - 이사 요청: 3개 (다양한 상태)
  - 견적: 5개 (편의 필드 포함)
  - 리뷰: 1개
  - 찜하기: 4개
  - 소셜 계정: 3개
  - 일반 유저 서비스: 3개
  `);
}

main()
  .catch((e) => {
    console.error("❌ 시드 데이터 생성 중 오류 발생:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

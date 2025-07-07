import {
  PrismaClient,
  UserType,
  MovingType,
  QuoteStatus,
  RequestStatus,
  ReviewStatus,
  SocialProvider,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import { encryptPhoneNumber } from "../../utils/phoneEncryption";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 시드 데이터 생성을 시작합니다...");

  // 1. 지역 데이터 생성
  console.log("📍 지역 데이터 생성 중...");
  const regions = await prisma.region.createMany({
    data: [
      { name: "서울", isActive: true },
      { name: "부산", isActive: true },
      { name: "대구", isActive: true },
      { name: "인천", isActive: true },
      { name: "광주", isActive: true },
      { name: "대전", isActive: true },
      { name: "울산", isActive: true },
      { name: "세종", isActive: true },
      { name: "경기", isActive: true },
      { name: "충북", isActive: true },
      { name: "충남", isActive: true },
      { name: "전북", isActive: true },
      { name: "전남", isActive: true },
      { name: "경북", isActive: true },
      { name: "경남", isActive: true },
      { name: "강원", isActive: true },
      { name: "제주", isActive: true },
    ],
  });

  // 2. 서비스 데이터 생성
  console.log("🔧 서비스 데이터 생성 중...");
  const services = await prisma.service.createMany({
    data: [
      {
        name: "소형이사",
        description: "원룸, 투룸 등 소규모 이사",
        isActive: true,
        iconUrl: "/icons/small-moving.svg",
      },
      {
        name: "가정이사",
        description: "일반 가정용 이사",
        isActive: true,
        iconUrl: "/icons/home-moving.svg",
      },
      {
        name: "사무실이사",
        description: "사무실 및 오피스 이사",
        isActive: true,
        iconUrl: "/icons/office-moving.svg",
      },
      {
        name: "포장이사",
        description: "포장까지 포함한 이사 서비스",
        isActive: true,
        iconUrl: "/icons/pack-moving.svg",
      },
      {
        name: "반포장이사",
        description: "일부 포장만 포함한 이사 서비스",
        isActive: true,
        iconUrl: "/icons/semi-pack-moving.svg",
      },
      {
        name: "일반이사",
        description: "기본 운송만 제공하는 이사",
        isActive: true,
        iconUrl: "/icons/basic-moving.svg",
      },
    ],
  });

  // 생성된 지역과 서비스 조회
  const createdRegions = await prisma.region.findMany();
  const createdServices = await prisma.service.findMany();

  // 3. 사용자 데이터 생성 (고객)
  console.log("👥 고객 사용자 데이터 생성 중...");
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: "customer1@example.com",
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-1234-5678"),
        currentRole: UserType.CUSTOMER,
        hasProfile: false,
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
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-2345-6789"),
        currentRole: UserType.CUSTOMER,
        hasProfile: false,
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
        encryptedPassword: await bcrypt.hash("password123", 10),
        encryptedPhoneNumber: encryptPhoneNumber("010-3456-7890"),
        currentRole: UserType.CUSTOMER,
        hasProfile: false,
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

  // 4. 기사님 사용자 데이터 생성
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

  // 5. 기사님 프로필 데이터 생성
  console.log("📝 기사님 프로필 데이터 생성 중...");
  const profiles = await Promise.all([
    prisma.profile.create({
      data: {
        userId: movers[0].id,
        nickname: "믿을만한김기사",
        profileImage: "/images/profile1.jpg",
        experience: 5,
        introduction: "5년 경력의 꼼꼼한 이사 전문가입니다",
        description: "안전하고 신속한 이사를 약속드립니다. 고객 만족도 98%를 자랑하는 전문 기사입니다.",
      },
    }),
    prisma.profile.create({
      data: {
        userId: movers[1].id,
        nickname: "신속한박기사",
        profileImage: "/images/profile2.jpg",
        experience: 8,
        introduction: "8년 경력의 신속한 이사 서비스",
        description: "빠르고 정확한 이사로 고객님의 시간을 절약해드립니다. 대형 이사도 전문적으로 처리합니다.",
      },
    }),
    prisma.profile.create({
      data: {
        userId: movers[2].id,
        nickname: "친절한이기사",
        profileImage: "/images/profile3.jpg",
        experience: 3,
        introduction: "고객 서비스 최우선 3년차 기사",
        description: "고객님의 소중한 물건을 내 것처럼 소중히 다뤄드립니다. 친절한 서비스가 저의 장점입니다.",
      },
    }),
    prisma.profile.create({
      data: {
        userId: movers[3].id,
        nickname: "전문가최기사",
        profileImage: "/images/profile4.jpg",
        experience: 12,
        introduction: "12년 경력의 이사 전문가",
        description: "어떤 이사든 완벽하게 처리해드립니다. 장거리 이사와 특수 물품 운반도 전문적으로 해드립니다.",
      },
    }),
  ]);

  // 6. 기사님 서비스 지역 설정
  console.log("🗺️ 기사님 서비스 지역 설정 중...");
  await prisma.profileRegion.createMany({
    data: [
      // 김기사 - 서울, 경기
      { profileId: profiles[0].id, regionId: createdRegions[0].id }, // 서울
      { profileId: profiles[0].id, regionId: createdRegions[8].id }, // 경기

      // 박기사 - 서울, 인천, 경기
      { profileId: profiles[1].id, regionId: createdRegions[0].id }, // 서울
      { profileId: profiles[1].id, regionId: createdRegions[3].id }, // 인천
      { profileId: profiles[1].id, regionId: createdRegions[8].id }, // 경기

      // 이기사 - 부산, 경상남도
      { profileId: profiles[2].id, regionId: createdRegions[1].id }, // 부산
      { profileId: profiles[2].id, regionId: createdRegions[14].id }, // 경상남도

      // 최기사 - 전국 서비스
      { profileId: profiles[3].id, regionId: createdRegions[0].id }, // 서울
      { profileId: profiles[3].id, regionId: createdRegions[1].id }, // 부산
      { profileId: profiles[3].id, regionId: createdRegions[2].id }, // 대구
      { profileId: profiles[3].id, regionId: createdRegions[8].id }, // 경기
    ],
  });

  // 7. 기사님 서비스 종류 설정
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
      { profileId: profiles[1].id, serviceId: createdServices[3].id },

      // 이기사 - 소형이사, 반포장이사
      { profileId: profiles[2].id, serviceId: createdServices[0].id },
      { profileId: profiles[2].id, serviceId: createdServices[4].id },

      // 최기사 - 전문 서비스
      { profileId: profiles[3].id, serviceId: createdServices[1].id },
      { profileId: profiles[3].id, serviceId: createdServices[2].id },
      { profileId: profiles[3].id, serviceId: createdServices[3].id },
    ],
  });

  // 8. 이사 요청 데이터 생성
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
        departureRegionId: createdRegions[0].id,
        arrivalRegionId: createdRegions[0].id,
        description: "냉장고와 세탁기 운반 주의 필요",
        status: RequestStatus.ACTIVE,
        estimatedDistance: 5.2,
        floor: 3,
        hasElevator: false,
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
        departureRegionId: createdRegions[8].id,
        arrivalRegionId: createdRegions[0].id,
        description: "피아노 운반 포함, 엘리베이터 사용 가능",
        status: RequestStatus.ACTIVE,
        estimatedDistance: 25.8,
        floor: 15,
        hasElevator: true,
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
        departureRegionId: createdRegions[0].id,
        arrivalRegionId: createdRegions[0].id,
        description: "사무용 컴퓨터 및 서류 다수, 주말 이사 희망",
        status: RequestStatus.ACTIVE,
        estimatedDistance: 8.3,
        floor: 12,
        hasElevator: true,
      },
    }),
  ]);

  // 9. 견적 데이터 생성
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
      },
    }),
  ]);

  // 10. 확정된 견적 업데이트
  console.log("✅ 확정된 견적 업데이트 중...");
  await prisma.movingRequest.update({
    where: { id: movingRequests[1].id },
    data: {
      confirmedQuoteId: quotes[2].id,
      status: RequestStatus.CONFIRMED,
    },
  });

  // 11. 현실적인 완료된 이사 및 리뷰 데이터 생성
  console.log("📝 완료된 이사 및 리뷰 데이터 생성 중...");

  // 기사님별 통계 (디자인에 맞는 현실적인 수치)
  const moverStatistics = [
    {
      mover: movers[0],
      completedCount: 136,
      avgRating: 5.0,
      reviewTexts: [
        "정말 친절하고 꼼꼼하게 이사해주셨어요! 물건 하나하나 조심스럽게 다뤄주시고 시간도 정확하게 지켜주셨습니다.",
        "믿을만한 기사님이세요. 안전하고 신속한 이사였습니다.",
        "5년 경력답게 정말 전문적이었어요. 추천합니다!",
      ],
    },
    {
      mover: movers[1],
      completedCount: 334,
      avgRating: 4.8,
      reviewTexts: [
        "신속하고 정확한 이사 서비스였습니다. 만족해요!",
        "대형 이사도 문제없이 처리해주셨어요.",
        "시간 절약해주는 빠른 서비스 감사합니다.",
      ],
    },
    {
      mover: movers[2],
      completedCount: 78,
      avgRating: 4.9,
      reviewTexts: [
        "정말 친절하세요! 고객 서비스가 최고입니다.",
        "소중한 물건들을 정말 조심스럽게 다뤄주셨어요.",
        "서비스 마인드가 훌륭한 기사님입니다.",
      ],
    },
    {
      mover: movers[3],
      completedCount: 512,
      avgRating: 4.7,
      reviewTexts: [
        "12년 경력의 전문성을 느낄 수 있었습니다.",
        "어려운 이사도 완벽하게 처리해주셨어요.",
        "경험이 많으셔서 안심이 되었습니다.",
      ],
    },
  ];

  // 각 기사님마다 몇 개의 샘플 완료된 이사 생성
  const sampleCompletedRequests = [];
  const sampleCompletedQuotes = [];

  for (let i = 0; i < moverStatistics.length; i++) {
    const { mover, avgRating, reviewTexts } = moverStatistics[i];

    // 각 기사님마다 5-8개의 샘플 완료된 이사 생성
    const sampleCount = Math.floor(Math.random() * 4) + 5;

    for (let j = 0; j < sampleCount; j++) {
      const request = await prisma.movingRequest.create({
        data: {
          userId: customers[j % customers.length].id,
          movingType: [MovingType.SMALL, MovingType.HOME, MovingType.OFFICE][j % 3],
          movingDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          departureAddr: `서울시 ${["강남구", "서초구", "송파구", "마포구"][j % 4]} ${j + 1}번지`,
          arrivalAddr: `경기도 ${["성남시", "수원시", "안양시", "용인시"][j % 4]} ${j + 10}번지`,
          departureRegionId: createdRegions[0].id,
          arrivalRegionId: createdRegions[8].id,
          description: `완료된 이사 - ${mover.email}의 ${j + 1}번째 케이스`,
          status: RequestStatus.COMPLETED,
          estimatedDistance: Math.floor(Math.random() * 50) + 5,
          floor: Math.floor(Math.random() * 20) + 1,
          hasElevator: Math.random() > 0.3,
        },
      });

      const quote = await prisma.quote.create({
        data: {
          requestId: request.id,
          moverId: mover.id,
          price: Math.floor(Math.random() * 500000) + 100000,
          description: `완료된 이사 견적 - ${mover.email}`,
          status: QuoteStatus.ACCEPTED,
          validUntil: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        },
      });

      await prisma.movingRequest.update({
        where: { id: request.id },
        data: { confirmedQuoteId: quote.id },
      });

      // 리뷰 생성 (90% 확률)
      if (Math.random() > 0.1) {
        const rating = generateRatingByAverage(avgRating);
        await prisma.review.create({
          data: {
            requestId: request.id,
            quoteId: quote.id,
            userId: customers[j % customers.length].id,
            moverId: mover.id,
            rating: rating,
            content: reviewTexts[j % reviewTexts.length],
            status: ReviewStatus.COMPLETED,
            isPublic: true,
          },
        });
      }

      sampleCompletedRequests.push(request);
      sampleCompletedQuotes.push(quote);
    }
  }

  // 평점 기반 리뷰 생성 함수
  function generateRatingByAverage(avgRating: number): number {
    const deviation = 0.3; // 평균에서 벗어나는 정도
    const minRating = Math.max(1, Math.floor(avgRating - deviation));
    const maxRating = Math.min(5, Math.ceil(avgRating + deviation));

    // 평균 점수 주변에서 가중치 부여
    if (Math.random() < 0.7) {
      return Math.round(avgRating);
    } else {
      return Math.floor(Math.random() * (maxRating - minRating + 1)) + minRating;
    }
  }

  console.log("✅ 현실적인 완료된 이사 및 리뷰 데이터 생성 완료!");

  // 12. 찜하기 데이터
  console.log("❤️ 찜하기 데이터 생성 중...");
  await prisma.favorite.createMany({
    data: [
      { userId: customers[0].id, moverId: movers[0].id },
      { userId: customers[0].id, moverId: movers[1].id },
      { userId: customers[1].id, moverId: movers[3].id },
      { userId: customers[2].id, moverId: movers[1].id },
    ],
  });

  // 13. 소셜 계정 데이터
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

  console.log("✨ 시드 데이터 생성이 완료되었습니다!");
  console.log(`
  📊 생성된 데이터 요약:
  - 지역: 17개
  - 서비스: 6개
  - 고객: 3명
  - 기사님: 4명
  - 프로필: 4개
  - 이사 요청: 4개
  - 견적: 6개
  - 리뷰: 1개
  - 찜하기: 4개
  - 소셜 계정: 3개
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

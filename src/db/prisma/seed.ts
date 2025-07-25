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

  // 주소 데이터 생성 (실제 대한민국 주소들)
  const addressData = [
    // 서울특별시 주소들
    {
      postalCode: "06123",
      city: "강남구",
      district: "역삼동",
      detail: "테헤란로 123",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06124",
      city: "강남구",
      district: "삼성동",
      detail: "영동대로 456",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06125",
      city: "서초구",
      district: "서초동",
      detail: "강남대로 789",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06126",
      city: "서초구",
      district: "반포동",
      detail: "신반포로 321",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06127",
      city: "마포구",
      district: "합정동",
      detail: "양화로 654",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06128",
      city: "마포구",
      district: "상암동",
      detail: "월드컵북로 987",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06129",
      city: "송파구",
      district: "잠실동",
      detail: "올림픽로 135",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06130",
      city: "송파구",
      district: "문정동",
      detail: "송파대로 246",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06131",
      city: "영등포구",
      district: "여의도동",
      detail: "여의대로 357",
      region: RegionType.SEOUL,
    },
    {
      postalCode: "06132",
      city: "영등포구",
      district: "당산동",
      detail: "당산로 468",
      region: RegionType.SEOUL,
    },
    // 경기도 주소들
    {
      postalCode: "16489",
      city: "수원시",
      district: "정자동",
      detail: "정자로 123",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16490",
      city: "수원시",
      district: "영통동",
      detail: "영통로 456",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16491",
      city: "성남시",
      district: "분당동",
      detail: "분당로 789",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16492",
      city: "성남시",
      district: "수정동",
      detail: "수정로 321",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16493",
      city: "용인시",
      district: "기흥동",
      detail: "기흥로 654",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16494",
      city: "용인시",
      district: "수지동",
      detail: "수지로 987",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16495",
      city: "고양시",
      district: "일산동",
      detail: "일산로 135",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16496",
      city: "고양시",
      district: "덕양동",
      detail: "덕양로 246",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16497",
      city: "부천시",
      district: "상동",
      detail: "상동로 357",
      region: RegionType.GYEONGGI,
    },
    {
      postalCode: "16498",
      city: "부천시",
      district: "중동",
      detail: "중동로 468",
      region: RegionType.GYEONGGI,
    },
  ];
  const addresses = await Promise.all(addressData.map((data) => prisma.address.create({ data })));

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
      encryptedPhoneNumber: encryptPhoneNumber(`010-${1000 + i}-${1000 + i}`),
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
      workedCount: 0, // 실제 확정된 견적 수에 따라 업데이트
      averageRating: 0, // 실제 리뷰 평점에 따라 업데이트
      totalReviewCount: 0, // 실제 리뷰 생성 후 업데이트
      currentAreas: [getRandom([RegionType.SEOUL, RegionType.GYEONGGI])],
      serviceTypes: [getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE])],
      totalFavoriteCount: 0, // 실제 찜 생성 후 업데이트
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
      }),
    ),
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
      ]),
    ),
  );

  // 견적 요청 180개 생성 (고객마다 진행중 1개 + 완료 5개씩)
  const estimateRequests = [];

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx];

    // 진행중인 견적 1개 (이사일: 2025년 7월 28일 ~ 9월 15일)
    const pendingMoveDate = new Date(2025, 6, 28 + Math.floor(Math.random() * 50)); // 2025년 7월 28일 ~ 9월 15일
    estimateRequests.push(
      prisma.estimateRequest.create({
        data: {
          customerId: user.id,
          moveType: getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
          moveDate: pendingMoveDate,
          fromAddressId: addresses[userIdx % addresses.length].id,
          toAddressId: addresses[(userIdx + 1) % addresses.length].id,
          status: RequestStatus.PENDING,
          description: `${user.name}님의 진행중인 견적 요청`,
        },
      }),
    );

    // 완료된 견적 5개 (이사일: 5월 22일 ~ 7월 22일)
    for (let j = 0; j < 5; j++) {
      const completedMoveDate = new Date(2024, 4, 22 + Math.floor(Math.random() * 62)); // 5월 22일 ~ 7월 22일
      estimateRequests.push(
        prisma.estimateRequest.create({
          data: {
            customerId: user.id,
            moveType: getRandom([MoveType.HOME, MoveType.SMALL, MoveType.OFFICE]),
            moveDate: completedMoveDate,
            fromAddressId: addresses[(userIdx + j) % addresses.length].id,
            toAddressId: addresses[(userIdx + j + 1) % addresses.length].id,
            status: RequestStatus.COMPLETED,
            description: `${user.name}님의 완료된 견적 요청 ${j + 1}`,
          },
        }),
      );
    }
  }

  const estimateRequestsResult = await Promise.all(estimateRequests);

  // 견적 생성 (각 견적 요청에 맞는 견적들)
  const estimatesArr = [];
  let estimateCount = 0;

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx];

    // 진행중인 견적에 대한 견적들 (5명의 기사가 PROPOSED 상태로)
    const pendingEstimateRequest = estimateRequestsResult[userIdx * 6]; // 각 유저의 첫 번째 견적 요청 (진행중)
    const availableMovers = users.filter((_, idx) => idx !== userIdx); // 본인 제외한 기사들

    // 진행중인 견적에 5명의 기사가 견적 제출
    for (let j = 0; j < 5; j++) {
      const mover = availableMovers[j % availableMovers.length];
      estimatesArr.push(
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

    // 완료된 견적들에 대한 견적들 (3~6명의 기사가 견적 제출)
    for (let k = 0; k < 5; k++) {
      const completedEstimateRequest = estimateRequestsResult[userIdx * 6 + 1 + k]; // 완료된 견적들
      const moverCount = 3 + Math.floor(Math.random() * 4); // 3~6명 랜덤

      for (let l = 0; l < moverCount; l++) {
        const mover = availableMovers[l % availableMovers.length];
        const isFirstEstimate = l === 0; // 첫 번째 견적인지 확인

        estimatesArr.push(
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

  const estimates = await Promise.all(estimatesArr);

  // 지정 견적 요청 생성 (진행중인 견적에 대해 일부 기사들에게 지정 요청)
  const designatedRequests = [];

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx];
    const pendingEstimateRequest = estimateRequestsResult[userIdx * 6]; // 진행중인 견적
    const availableMovers = users.filter((_, idx) => idx !== userIdx);

    // 이미 견적서를 보낸 기사들의 ID 수집
    const moversWhoSentEstimates = estimates
      .filter((estimate) => estimate.estimateRequestId === pendingEstimateRequest.id)
      .map((estimate) => estimate.moverId);

    // 견적서를 보내지 않은 기사들만 필터링
    const moversWhoDidNotSendEstimates = availableMovers.filter((mover) => !moversWhoSentEstimates.includes(mover.id));

    // 진행중인 견적에 대해 2-3명의 기사에게 지정 견적 요청 (견적서를 보내지 않은 기사들만)
    const designatedCount = Math.min(2 + Math.floor(Math.random() * 2), moversWhoDidNotSendEstimates.length); // 2-3명

    for (let j = 0; j < designatedCount; j++) {
      const mover = moversWhoDidNotSendEstimates[j];
      const expiresAt = new Date(pendingEstimateRequest.moveDate.getTime() - 24 * 60 * 60 * 1000); // 이사일 하루 전

      designatedRequests.push(
        prisma.designatedMover.create({
          data: {
            estimateRequestId: pendingEstimateRequest.id,
            moverId: mover.id,
            message: `${user.name}님이 ${mover.name}님께 지정 견적을 요청합니다.`,
            status: "PENDING",
            expiresAt: expiresAt,
          },
        }),
      );
    }
  }

  await Promise.all(designatedRequests);

  // 찜 생성 (고객마다 10~20명의 랜덤한 기사 찜)
  const favoriteArr = [];

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx];
    const availableMovers = users.filter((_, idx) => idx !== userIdx); // 본인 제외한 기사들
    const favoriteCount = 10 + Math.floor(Math.random() * 11); // 10~20명 랜덤

    // 랜덤하게 기사 선택 (중복 방지)
    const selectedMovers = [];
    const usedIndices = new Set();

    while (selectedMovers.length < favoriteCount && selectedMovers.length < availableMovers.length) {
      const randomIdx = Math.floor(Math.random() * availableMovers.length);
      if (!usedIndices.has(randomIdx)) {
        usedIndices.add(randomIdx);
        selectedMovers.push(availableMovers[randomIdx]);
      }
    }

    // 찜 생성
    for (const mover of selectedMovers) {
      favoriteArr.push(
        prisma.favorite.create({
          data: {
            customerId: user.id,
            moverId: mover.id,
          },
        }),
      );
    }
  }

  const favorites = await Promise.all(favoriteArr);

  // 찜 카운트 업데이트 (실제 생성된 찜 데이터 기반)
  const favoriteCounts: { [key: string]: number } = {};
  for (const favorite of favorites) {
    const moverId = favorite.moverId;
    if (!favoriteCounts[moverId]) {
      favoriteCounts[moverId] = 0;
    }
    favoriteCounts[moverId]++;
  }

  // 각 기사의 찜 카운트 업데이트
  await Promise.all(
    Object.entries(favoriteCounts).map(([moverId, count]) =>
      prisma.user.update({
        where: { id: moverId },
        data: { totalFavoriteCount: count },
      }),
    ),
  );

  // 리뷰 생성 (완료된 견적에서 확정된 것들에 대해)
  const reviewArr = [];

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx];

    // 완료된 견적들에 대해 리뷰 생성
    for (let k = 0; k < 5; k++) {
      const completedEstimateRequest = estimateRequestsResult[userIdx * 6 + 1 + k];

      // 해당 견적 요청에서 수락된 견적을 찾기
      const acceptedEstimate = estimates.find(
        (estimate) =>
          estimate.estimateRequestId === completedEstimateRequest.id && estimate.status === EstimateStatus.ACCEPTED,
      );

      if (acceptedEstimate) {
        // 수락된 견적의 기사에게 리뷰 작성
        reviewArr.push(
          prisma.review.create({
            data: {
              customerId: user.id,
              moverId: acceptedEstimate.moverId,
              estimateRequestId: completedEstimateRequest.id,
              rating: 3 + Math.floor(Math.random() * 3), // 3~5점 랜덤
              content: `${user.name}님의 리뷰 - ${acceptedEstimate.comment}`,
            },
          }),
        );
      }
    }
  }

  const reviews = await Promise.all(reviewArr);

  // 각 기사의 리뷰 카운트 및 평점 업데이트
  const moverStats: {
    [key: string]: {
      reviewCount: number;
      totalRating: number;
      workedCount: number;
    };
  } = {};

  // 리뷰 데이터로 통계 계산
  for (const review of reviews) {
    const moverId = review.moverId;
    if (!moverStats[moverId]) {
      moverStats[moverId] = { reviewCount: 0, totalRating: 0, workedCount: 0 };
    }
    moverStats[moverId].reviewCount++;
    moverStats[moverId].totalRating += review.rating;
  }

  // 확정된 견적 수 계산 (ACCEPTED 상태인 견적들)
  for (const estimate of estimates) {
    if (estimate.status === EstimateStatus.ACCEPTED) {
      const moverId = estimate.moverId;
      if (!moverStats[moverId]) {
        moverStats[moverId] = {
          reviewCount: 0,
          totalRating: 0,
          workedCount: 0,
        };
      }
      moverStats[moverId].workedCount++;
    }
  }

  // 각 기사의 통계 업데이트
  await Promise.all(
    Object.entries(moverStats).map(([moverId, stats]) =>
      prisma.user.update({
        where: { id: moverId },
        data: {
          totalReviewCount: stats.reviewCount,
          averageRating: stats.reviewCount > 0 ? stats.totalRating / stats.reviewCount : 0,
          workedCount: stats.workedCount,
        },
      }),
    ),
  );

  // 견적 요청 생성 활동 및 알림
  const estimateRequestActions = [];
  const estimateRequestNotifications = [];

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx];

    // 진행중인 견적 요청에 대한 활동 및 알림
    const pendingEstimateRequest = estimateRequestsResult[userIdx * 6];
    const estimateRequestAction = await prisma.action.create({
      data: {
        userId: user.id,
        type: ActionType.ESTIMATE_REQUEST_CREATE,
        entityId: pendingEstimateRequest.id,
        entityType: "EstimateRequest",
        description: `${user.name}님이 견적 요청을 생성했습니다.`,
      },
    });
    estimateRequestActions.push(estimateRequestAction);

    // 견적 요청 생성 알림 (기사들에게)
    const availableMovers = users.filter((_, idx) => idx !== userIdx);
    for (let j = 0; j < 5; j++) {
      const mover = availableMovers[j % availableMovers.length];
      estimateRequestNotifications.push(
        prisma.notification.create({
          data: {
            actionId: estimateRequestAction.id,
            userId: mover.id,
            type: NotificationType.ESTIMATE_REQUEST_ARRIVED,
            title: "새로운 견적 요청이 도착했습니다",
            content: `${user.name}님이 견적을 요청했습니다.`,
            path: `/estimateRequest/${pendingEstimateRequest.id}`,
          },
        }),
      );
    }
  }

  // 견적 제출 활동 및 알림
  const estimateActions = [];
  const estimateNotifications = [];

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    const user = users[userIdx];
    const availableMovers = users.filter((_, idx) => idx !== userIdx);

    // 진행중인 견적에 대한 견적 제출 활동
    const pendingEstimateRequest = estimateRequestsResult[userIdx * 6];
    for (let j = 0; j < 5; j++) {
      const mover = availableMovers[j % availableMovers.length];
      const estimateAction = await prisma.action.create({
        data: {
          userId: mover.id,
          type: ActionType.ESTIMATE_SUBMITTED,
          entityId: pendingEstimateRequest.id,
          entityType: "EstimateRequest",
          description: `${mover.name}님이 견적을 제출했습니다.`,
        },
      });
      estimateActions.push(estimateAction);

      // 견적 제출 알림 (고객에게)
      estimateNotifications.push(
        prisma.notification.create({
          data: {
            actionId: estimateAction.id,
            userId: user.id,
            type: NotificationType.ESTIMATE_ARRIVED,
            title: "새로운 견적이 도착했습니다",
            content: `${mover.name}님이 견적을 제출했습니다.`,
            path: `/estimateRequest/${pendingEstimateRequest.id}`,
          },
        }),
      );
    }

    // 완료된 견적들에 대한 견적 제출 활동
    for (let k = 0; k < 5; k++) {
      const completedEstimateRequest = estimateRequestsResult[userIdx * 6 + 1 + k];
      const moverCount = 3 + Math.floor(Math.random() * 4); // 3~6명

      for (let l = 0; l < moverCount; l++) {
        const mover = availableMovers[l % availableMovers.length];
        const isFirstEstimate = l === 0;

        const estimateAction = await prisma.action.create({
          data: {
            userId: mover.id,
            type: ActionType.ESTIMATE_SUBMITTED,
            entityId: completedEstimateRequest.id,
            entityType: "EstimateRequest",
            description: `${mover.name}님이 견적을 제출했습니다.`,
          },
        });
        estimateActions.push(estimateAction);

        // 견적 제출 알림 (고객에게)
        estimateNotifications.push(
          prisma.notification.create({
            data: {
              actionId: estimateAction.id,
              userId: user.id,
              type: NotificationType.ESTIMATE_ARRIVED,
              title: "새로운 견적이 도착했습니다",
              content: `${mover.name}님이 견적을 제출했습니다.`,
            },
          }),
        );

        // 견적 수락/거절 알림 (기사에게)
        if (isFirstEstimate) {
          const acceptAction = await prisma.action.create({
            data: {
              userId: user.id,
              type: ActionType.ESTIMATE_ACCEPTED,
              entityId: completedEstimateRequest.id,
              entityType: "EstimateRequest",
              description: `${user.name}님이 견적을 수락했습니다.`,
            },
          });

          estimateNotifications.push(
            prisma.notification.create({
              data: {
                actionId: acceptAction.id,
                userId: mover.id,
                type: NotificationType.ESTIMATE_STATUS_UPDATED,
                title: "견적이 수락되었습니다",
                content: `${user.name}님이 견적을 수락했습니다.`,
                path: `/estimateRequest/${completedEstimateRequest.id}`,
              },
            }),
          );
        } else {
          const rejectAction = await prisma.action.create({
            data: {
              userId: user.id,
              type: ActionType.ESTIMATE_REJECTED,
              entityId: completedEstimateRequest.id,
              entityType: "EstimateRequest",
              description: `${user.name}님이 다른 견적을 선택했습니다.`,
            },
          });

          estimateNotifications.push(
            prisma.notification.create({
              data: {
                actionId: rejectAction.id,
                userId: mover.id,
                type: NotificationType.ESTIMATE_STATUS_UPDATED,
                title: "견적이 자동 거절되었습니다",
                content: `${user.name}님이 다른 견적을 선택했습니다.`,
                path: `/estimateRequest/${completedEstimateRequest.id}`,
              },
            }),
          );
        }
      }
    }
  }

  // 모든 알림 생성
  await Promise.all([...estimateRequestNotifications, ...estimateNotifications]);

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

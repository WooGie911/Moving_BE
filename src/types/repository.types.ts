import { Prisma } from "@prisma/client";

// Repository에서 반환하는 EstimateRequest 타입 (실제 select와 완전 일치)
export type EstimateRequestWithRelations = Prisma.EstimateRequestGetPayload<{
  select: {
    id: true;
    customerId: true;
    moveType: true;
    moveDate: true;
    createdAt: true;
    description: true;
    status: true;
    fromAddress: {
      select: {
        zoneCode: true;
        city: true;
        district: true;
        detail: true;
        region: true;
      };
    };
    toAddress: {
      select: {
        zoneCode: true;
        city: true;
        district: true;
        detail: true;
        region: true;
      };
    };
    estimates: {
      where: {
        price: {
          not: null;
        };
        status: {
          in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"];
        };
      };
      select: {
        id: true;
        price: true;
        comment: true;
        status: true;
        isDesignated: true;
        createdAt: true;
        mover: {
          select: {
            id: true;
            name: true;
            userType: true;
            moverImage: true;
            nickname: true;
            isVeteran: true;
            shortIntro: true;
            detailIntro: true;
            career: true;
            workedCount: true;
            averageRating: true;
            totalReviewCount: true;
            serviceTypes: true;
            serviceAreas: true;
            totalFavoriteCount: true;
            Favorite: {
              where: {
                deletedAt: null;
              };
              select: {
                id: true;
              };
            };
          };
        };
      };
    };
  };
}> | null;

// 단일 EstimateRequest 조회용 타입
export type SingleEstimateRequestWithRelations = EstimateRequestWithRelations;

// 여러 EstimateRequest 조회용 타입 (null 없음 - findMany 결과용)
export type MultipleEstimateRequestWithRelations =
  Prisma.EstimateRequestGetPayload<{
    select: {
      id: true;
      customerId: true;
      moveType: true;
      moveDate: true;
      createdAt: true;
      description: true;
      status: true;
      fromAddress: {
        select: {
          zoneCode: true;
          city: true;
          district: true;
          detail: true;
          region: true;
        };
      };
      toAddress: {
        select: {
          zoneCode: true;
          city: true;
          district: true;
          detail: true;
          region: true;
        };
      };
      estimates: {
        where: {
          price: {
            not: null;
          };
          status: {
            in: ["PROPOSED", "ACCEPTED", "AUTO_REJECTED"];
          };
        };
        select: {
          id: true;
          price: true;
          comment: true;
          status: true;
          isDesignated: true;
          createdAt: true;
          mover: {
            select: {
              id: true;
              name: true;
              userType: true;
              moverImage: true;
              nickname: true;
              isVeteran: true;
              shortIntro: true;
              detailIntro: true;
              career: true;
              workedCount: true;
              averageRating: true;
              totalReviewCount: true;
              serviceTypes: true;
              serviceAreas: true;
              totalFavoriteCount: true;
              Favorite: {
                where: {
                  deletedAt: null;
                };
                select: {
                  id: true;
                };
              };
            };
          };
        };
      };
    };
  }>[];

// Address 타입 (Repository에서 사용)
export type RepositoryAddress = Prisma.AddressGetPayload<{
  select: {
    zoneCode: true;
    city: true;
    district: true;
    detail: true;
    region: true;
  };
}>;

// Mover 타입 (Repository에서 사용)
export type RepositoryMover = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    userType: true;
    moverImage: true;
    nickname: true;
    isVeteran: true;
    shortIntro: true;
    detailIntro: true;
    career: true;
    workedCount: true;
    averageRating: true;
    totalReviewCount: true;
    serviceTypes: true;
    serviceAreas: true;
    totalFavoriteCount: true;
    Favorite: {
      select: {
        id: true;
      };
    };
  };
}>;

// Estimate 타입 (Repository에서 사용)
export type RepositoryEstimate = Prisma.EstimateGetPayload<{
  select: {
    id: true;
    price: true;
    comment: true;
    status: true;
    isDesignated: true;
    createdAt: true; // 누락된 필드 추가
    mover: {
      select: {
        id: true;
        name: true;
        userType: true;
        moverImage: true;
        nickname: true;
        isVeteran: true;
        shortIntro: true;
        detailIntro: true;
        career: true;
        workedCount: true;
        averageRating: true;
        totalReviewCount: true;
        serviceTypes: true;
        serviceAreas: true;
        totalFavoriteCount: true;
        Favorite: {
          select: {
            id: true;
          };
        };
      };
    };
  };
}>;

// ===== Mover 전용 Repository 타입들 =====

// Mover용 EstimateRequest 타입 (지역/지정 견적 조회용)
export type MoverEstimateRequestWithRelations =
  Prisma.EstimateRequestGetPayload<{
    select: {
      id: true;
      customerId: true;
      moveType: true;
      moveDate: true;
      fromAddressId: true;
      toAddressId: true;
      description: true;
      status: true;
      createdAt: true;
      updatedAt: true;
      customer: {
        select: {
          id: true;
          name: true;
          currentArea: true;
          customerImage: true;
          nickname: true;
        };
      };
      fromAddress: {
        select: {
          id: true;
          zoneCode: true;
          city: true;
          district: true;
          detail: true;
          region: true;
        };
      };
      toAddress: {
        select: {
          id: true;
          zoneCode: true;
          city: true;
          district: true;
          detail: true;
          region: true;
        };
      };
      estimates: {
        select: {
          id: true;
          moverId: true;
          price: true;
          comment: true;
          status: true;
          rejectReason: true;
          isDesignated: true;
          workingHours: true;
          includesPackaging: true;
          insuranceAmount: true;
          validUntil: true;
          createdAt: true;
          updatedAt: true;
          deletedAt: true;
        };
      };
    };
  }>;

// Mover용 Estimate 타입 (견적 생성/수정/조회용)
export type MoverEstimateWithRelations = Prisma.EstimateGetPayload<{
  select: {
    id: true;
    moverId: true;
    estimateRequestId: true;
    price: true;
    comment: true;
    status: true;
    rejectReason: true;
    isDesignated: true;
    workingHours: true;
    includesPackaging: true;
    insuranceAmount: true;
    validUntil: true;
    createdAt: true;
    updatedAt: true;
    deletedAt: true;
    mover: {
      select: {
        id: true;
        name: true;
        moverImage: true;
        nickname: true;
        shortIntro: true;
        detailIntro: true;
        career: true;
        workedCount: true;
        averageRating: true;
        totalReviewCount: true;
        serviceTypes: true;
      };
    };
    estimateRequest: {
      select: {
        id: true;
        customerId: true;
        moveType: true;
        moveDate: true;
        fromAddressId: true;
        toAddressId: true;
        description: true;
        status: true;
        createdAt: true;
        updatedAt: true;
        customer: {
          select: {
            id: true;
            name: true;
            currentArea: true;
            customerImage: true;
            nickname: true;
          };
        };
        fromAddress: {
          select: {
            id: true;
            zoneCode: true;
            city: true;
            district: true;
            detail: true;
            region: true;
          };
        };
        toAddress: {
          select: {
            id: true;
            zoneCode: true;
            city: true;
            district: true;
            detail: true;
            region: true;
          };
        };
      };
    };
  };
}>;

// Mover용 다중 EstimateRequest 타입
export type MultipleMoverEstimateRequestWithRelations =
  MoverEstimateRequestWithRelations[];

// Mover용 단일 EstimateRequest 타입
export type SingleMoverEstimateRequestWithRelations =
  MoverEstimateRequestWithRelations;

// Mover용 Customer 정보 타입
export type MoverRepositoryCustomer = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    currentArea: true;
    customerImage: true;
    nickname: true;
  };
}>;

// Mover용 Address 정보 타입
export type MoverRepositoryAddress = Prisma.AddressGetPayload<{
  select: {
    id: true;
    zoneCode: true;
    city: true;
    district: true;
    detail: true;
    region: true;
  };
}>;

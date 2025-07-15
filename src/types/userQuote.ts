import { DesignatedEstimateRequest, Quote } from "@prisma/client";
import { Estimate } from "@prisma/client";
import { User } from "@prisma/client";
import { Profile } from "@prisma/client";

export type TQuote = Pick<
  Quote,
  | "movingType"
  | "createdAt"
  | "departureAddr"
  | "arrivalAddr"
  | "departureDetail"
  | "status"
  | "confirmedEstimateId"
  | "estimateCount"
  | "designatedEstimateCount"
> & {
  estimates: TEstimate[] | null;
};

export type TEstimate = Pick<Estimate, "price" | "description" | "status" | "isDesignated"> & {
  mover: {
    id: number;
    name: string;
    currentRole: string;
    profile: Pick<
      Profile,
      | "nickname"
      | "profileImage"
      | "experience"
      | "introduction"
      | "description"
      | "completedCount"
      | "avgRating"
      | "reviewCount"
      | "favoriteCount"
    > | null;
  };
};
export type TConfirmEstimateResult = {
  quote: Quote; // 또는 필요한 필드만 Pick해서 사용 가능
  estimate: Estimate;
};
export type TDesignatedEstimateRequest = Pick<
  DesignatedEstimateRequest,
  "quoteId" | "customerId" | "moverId" | "message" | "status" | "expiresAt"
>;

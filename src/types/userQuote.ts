import { Quote } from "@prisma/client";
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
>;

export type TEstimate = Pick<
  Estimate,
  "price" | "description" | "status" | "isDesignated"
> & {
  mover: {
    profile: Pick<Profile, "id" | "imageUrl">;
  };
};

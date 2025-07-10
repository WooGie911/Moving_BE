import { Region } from "@prisma/client";

export interface IMoverListFilter {
  region?: Region;
  serviceTypeId?: number;
  search?: string;
  sort?: "review" | "rating" | "career" | "confirmed";
  cursor?: number;
  take?: number;
}

export type TOrderByType = Record<string, "asc" | "desc">;
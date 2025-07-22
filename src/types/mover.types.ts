export type MoverListFilter = {
  region?: string;
  serviceType?: string;
  search?: string;
  sort?: string;
  cursor?: string;
  take?: number;
};

export interface MoverResponse {
  id: string;
  nickname: string;
  name: string;
  experience: number;
  introduction: string;
  description: string;
  completedCount: number;
  avgRating: number;
  reviewCount: number;
  favoriteCount: number;
  lastActivityAt: Date | null;
  serviceAreas: any[];
  serviceTypes?: any[];
  favorites?: any[];
}

export interface DesignatedQuoteRequestDto {
  quoteId: string;
  moverId: string;
  message?: string;
  expiresAt: Date;
}

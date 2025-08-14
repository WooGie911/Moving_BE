// 찜하기 요청 타입
export interface IFavoriteRequest {
  moverId: string;
}

// 찜하기 상태 타입
export interface IFavoriteStatus {
  isFavorited: boolean;
  favoriteCount: number;
}

// 찜하기 응답 타입
export interface IFavoriteResponse {
  success: boolean;
  message: string;
  data?: IFavoriteStatus;
}
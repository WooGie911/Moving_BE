export interface IActionMetadata {
  moverName?: string;
  customerName?: string;
  moveType?: string;
  estimateRequestId?: string;
  estimateId?: string;
  reviewId?: string;
  favoriteId?: string;
  moverId?: string;
  customerId?: string;
    
  // 필요한 경우 추가 변수 선언
  [key: string]: any;
} 
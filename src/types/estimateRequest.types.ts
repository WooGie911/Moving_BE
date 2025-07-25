export type TCreateEstimateRequest = {
  userId: string;
  movingType: string;
  movingDate: string;
  departure: {
    roadAddress: string;
    detailAddress?: string;
    zonecode: string;
    jibunAddress: string;
    extraAddress: string;
  };
  arrival: {
    roadAddress: string;
    detailAddress?: string;
    zonecode: string;
    jibunAddress: string;
    extraAddress: string;
  };
  description?: string;
};

export type TUpdateEstimateRequest = {
  movingType?: string;
  movingDate?: string;
  departure?: {
    roadAddress: string;
    detailAddress?: string;
    zonecode: string;
    jibunAddress: string;
    extraAddress: string;
  };
  arrival?: {
    roadAddress: string;
    detailAddress?: string;
    zonecode: string;
    jibunAddress: string;
    extraAddress: string;
  };
  description?: string;
};

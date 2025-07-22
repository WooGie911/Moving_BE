export type TCreateEstimateRequest = {
  userId: string;
  moveType: string;
  fromCity: string;
  fromDistrict: string;
  fromDetail?: string;
  fromRegion: string;
  toCity: string;
  toDistrict: string;
  toDetail?: string;
  toRegion: string;
  moveDate: string;
  description?: string;
};

import { IParsedAddressData } from "../types/estimateRequest.types";

// 지역명 매핑
const REGION_MAP: { [key: string]: string } = {
  서울특별시: "SEOUL",
  서울: "SEOUL",
  부산광역시: "BUSAN",
  부산: "BUSAN",
  대구광역시: "DAEGU",
  대구: "DAEGU",
  인천광역시: "INCHEON",
  인천: "INCHEON",
  광주광역시: "GWANGJU",
  광주: "GWANGJU",
  대전광역시: "DAEJEON",
  대전: "DAEJEON",
  울산광역시: "ULSAN",
  울산: "ULSAN",
  세종특별자치시: "SEJONG",
  세종: "SEJONG",
  경기도: "GYEONGGI",
  경기: "GYEONGGI",
  강원도: "GANGWON",
  강원: "GANGWON",
  충청북도: "CHUNGBUK",
  충북: "CHUNGBUK",
  충청남도: "CHUNGNAM",
  충남: "CHUNGNAM",
  전라북도: "JEONBUK",
  전북: "JEONBUK",
  전라남도: "JEONNAM",
  전남: "JEONNAM",
  경상북도: "GYEONGBUK",
  경북: "GYEONGBUK",
  경상남도: "GYEONGNAM",
  경남: "GYEONGNAM",
  제주특별자치도: "JEJU",
  제주: "JEJU",
};

const ENGLISH_TO_KOREAN: { [key: string]: string } = {
  SEOUL: "서울",
  BUSAN: "부산",
  DAEGU: "대구",
  INCHEON: "인천",
  GWANGJU: "광주",
  DAEJEON: "대전",
  ULSAN: "울산",
  SEJONG: "세종",
  GYEONGGI: "경기",
  GANGWON: "강원",
  CHUNGBUK: "충북",
  CHUNGNAM: "충남",
  JEONBUK: "전북",
  JEONNAM: "전남",
  GYEONGBUK: "경북",
  GYEONGNAM: "경남",
  JEJU: "제주",
};

/**
 * 지역명을 enum으로 매핑
 */
const mapRegionToEnum = (region: string): string => {
  return REGION_MAP[region] || "SEOUL";
};

/**
 * 영어 지역명을 한글로 변환
 */
export const convertRegionToKorean = (englishRegion: string): string => {
  return ENGLISH_TO_KOREAN[englishRegion] || englishRegion;
};

/**
 * 주소를 파싱
 */
export const parseAddress = (addressObj: {
  roadAddress: string;
  detailAddress?: string;
  postalCode?: string;
  zonecode?: string;
}): IParsedAddressData => {
  const postalCode = addressObj.zonecode || addressObj.postalCode || "";
  const addressParts = addressObj.roadAddress.split(" ");

  if (addressParts.length < 3) {
    throw new Error("올바른 주소 형식이 아닙니다.");
  }

  const [region, city, district, ...detailParts] = addressParts;

  if (addressObj.detailAddress) {
    detailParts.push(addressObj.detailAddress);
  }

  return {
    postalCode,
    region: mapRegionToEnum(region),
    city,
    district,
    detail: detailParts.join(" ").trim() || null,
  };
};

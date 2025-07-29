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
  강원특별자치도: "GANGWON",
  강원도: "GANGWON",
  강원: "GANGWON",
  충청북도: "CHUNGBUK",
  충북: "CHUNGBUK",
  충청남도: "CHUNGNAM",
  충남: "CHUNGNAM",
  전북특별자치도: "JEONBUK",
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
  GANGWON: "강원특별자치도",
  CHUNGBUK: "충북",
  CHUNGNAM: "충남",
  JEONBUK: "전북특별자치도",
  JEONNAM: "전남",
  GYEONGBUK: "경북",
  GYEONGNAM: "경남",
  JEJU: "제주특별자치도",
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
  zoneCode?: string;
  zonecode?: string;
}): IParsedAddressData => {
  const zoneCode = addressObj.zonecode || addressObj.zoneCode || "";

  // roadAddress 예시: "경기 성남시 분당구 대왕판교로 364", "서울 강남구 테헤란로 123", "전북특별자치도 군산시 나운동 하나운안1길 40"
  const roadAddressParts = addressObj.roadAddress.split(" ");

  if (roadAddressParts.length < 3) {
    throw new Error("올바른 주소 형식이 아닙니다.");
  }

  // 첫 번째 부분은 시도 (경기, 서울, 전북특별자치도 등)
  const region = roadAddressParts[0];

  // 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종은 특별시/광역시
  // 전북특별자치도, 제주특별자치도는 특별자치도
  const isMetropolitan = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종"].includes(region);
  const isSpecialSelfGoverning = ["전북특별자치도", "제주특별자치도"].includes(region);

  let city: string;
  let district: string;
  let detail: string;

  if (isMetropolitan) {
    // 특별시/광역시: 구가 city, 동이 district
    // 예: "서울 강남구 역삼동 테헤란로 123"
    if (roadAddressParts.length >= 4) {
      city = roadAddressParts[1]; // 강남구
      district = roadAddressParts[2]; // 역삼동
      detail = roadAddressParts.slice(3).join(" "); // 테헤란로 123
    } else {
      // 동 정보가 없는 경우: "서울 강남구 테헤란로 123"
      city = roadAddressParts[1]; // 강남구
      district = ""; // 빈 문자열
      detail = roadAddressParts.slice(2).join(" "); // 테헤란로 123
    }
  } else if (isSpecialSelfGoverning) {
    // 특별자치도: 시/군이 city, 구/동이 district
    // 예: "전북특별자치도 군산시 나운동 하나운안1길 40"
    if (roadAddressParts.length >= 4) {
      city = roadAddressParts[1]; // 군산시
      district = roadAddressParts[2]; // 나운동
      detail = roadAddressParts.slice(3).join(" "); // 하나운안1길 40
    } else {
      // 구/동 정보가 없는 경우: "전북특별자치도 군산시 하나운안1길 40"
      city = roadAddressParts[1]; // 군산시
      district = ""; // 빈 문자열
      detail = roadAddressParts.slice(2).join(" "); // 하나운안1길 40
    }
  } else {
    // 일반 시/군: 시/군이 city, 구가 district
    // 예: "경기 성남시 분당구 대왕판교로 364"
    if (roadAddressParts.length >= 4) {
      city = roadAddressParts[1]; // 성남시
      district = roadAddressParts[2]; // 분당구
      detail = roadAddressParts.slice(3).join(" "); // 대왕판교로 364
    } else {
      // 구 정보가 없는 경우: "경기 성남시 대왕판교로 364"
      city = roadAddressParts[1]; // 성남시
      district = ""; // 빈 문자열
      detail = roadAddressParts.slice(2).join(" "); // 대왕판교로 364
    }
  }

  return {
    zoneCode,
    region: mapRegionToEnum(region),
    city: city,
    district: district,
    detail: detail || null,
  };
};

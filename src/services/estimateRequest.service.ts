import estimateRequestRepository from "../repositories/estimateRequest.repository";
import { TCreateEstimateRequest, TUpdateEstimateRequest } from "../types/estimateRequest.types";
import { getKoreaToday } from "../utils/dateUtils";

class EstimateRequestService {
  // 유저의 유형을 확인하는 메서드
  async checkUserType(userId: string): Promise<{ isCustomer: boolean; isMover: boolean }> {
    return await estimateRequestRepository.checkUserType(userId);
  }

  async hasPendingRequest(userId: string): Promise<boolean> {
    return await estimateRequestRepository.hasPendingRequest(userId);
  }

  async isActiveRequestPending(userId: string): Promise<boolean> {
    return await estimateRequestRepository.isActiveRequestPending(userId);
  }

  async hasEstimateFromMover(userId: string): Promise<boolean> {
    return await estimateRequestRepository.hasEstimateFromMover(userId);
  }

  // 이사일이 지난 견적 요청을 만료 처리하는 메서드
  async expireOverdueRequests(): Promise<void> {
    const koreaToday = getKoreaToday();
    await estimateRequestRepository.expireOverdueRequests(koreaToday);
  }

  // 견적 요청이 만료되었는지 확인하는 메서드
  async isRequestExpired(estimateRequestId: string): Promise<boolean> {
    return await estimateRequestRepository.isRequestExpired(estimateRequestId);
  }

  async getActiveEstimateRequestByUserId(userId: string) {
    return await estimateRequestRepository.getActiveEstimateRequestByUserId(userId);
  }

  async createEstimateRequest(params: TCreateEstimateRequest) {
    const { userId, movingType, movingDate, departure, arrival, description } = params;

    // 주소 파싱 함수
    const parseAddress = (addressObj: any) => {
      const roadAddress = addressObj.roadAddress;
      console.log("파싱할 주소:", roadAddress); // 디버깅용

      // 카카오 주소 API에서 오는 형태: "서울특별시 강남구 테헤란로 123"
      // 또는 "경기도 성남시 분당구 경부고속도로 409"

      // 주소를 공백으로 분리
      const parts = roadAddress.split(" ");
      console.log("분리된 주소 부분들:", parts); // 디버깅용

      // 첫 번째 부분이 시/도인지 확인
      const firstPart = parts[0];
      console.log("첫 번째 부분:", firstPart); // 디버깅용

      // 시/도 매핑이 가능한지 확인
      const mappedRegion = this.mapRegionToEnum(firstPart);
      console.log("매핑된 지역:", mappedRegion); // 디버깅용

      // 매핑이 성공한 경우 (첫 번째 부분이 시/도인 경우)
      if (mappedRegion !== "SEOUL" || firstPart === "서울" || firstPart === "서울특별시") {
        if (parts.length >= 4) {
          // "서울특별시 강남구 역삼동 테헤란로 123" 형태
          const region = parts[0]; // 서울특별시
          const city = parts[1]; // 강남구
          const district = parts[2]; // 역삼동
          const detail = parts.slice(3).join(" ") + (addressObj.detailAddress ? ` ${addressObj.detailAddress}` : ""); // 테헤란로 123 21

          console.log("파싱 결과 (4개 이상):", { region, city, district, detail }); // 디버깅용

          return {
            city,
            district,
            detail,
            region: this.mapRegionToEnum(region),
          };
        } else if (parts.length === 3) {
          // "서울특별시 강남구 테헤란로 123" 형태
          const region = parts[0]; // 서울특별시
          const city = parts[1]; // 강남구
          const district = ""; // 빈 문자열
          const detail = parts.slice(2).join(" ") + (addressObj.detailAddress ? ` ${addressObj.detailAddress}` : ""); // 테헤란로 123 21

          console.log("파싱 결과 (3개):", { region, city, district, detail }); // 디버깅용

          return {
            city,
            district,
            detail,
            region: this.mapRegionToEnum(region),
          };
        } else if (parts.length === 2) {
          // "강원특별자치도 홍천군" 형태 - city에 다 넣지 말고 detail에 넣기
          const region = parts[0]; // 강원특별자치도
          const city = ""; // 빈 문자열로 설정
          const detail = parts[1] + (addressObj.detailAddress ? ` ${addressObj.detailAddress}` : ""); // 홍천군 1

          console.log("파싱 결과 (2개):", { region, city, district: "", detail }); // 디버깅용

          return {
            city,
            district: "",
            detail,
            region: this.mapRegionToEnum(region),
          };
        }
      }

      // 매핑되지 않는 경우 기본값
      console.log("매핑되지 않는 주소 형태, 기본값 사용");
      return {
        city: roadAddress,
        district: "",
        detail: addressObj.detailAddress || "",
        region: "SEOUL" as any,
      };
    };

    // 출발지 주소 생성 또는 검색
    const fromAddressData = parseAddress(departure);
    const fromAddress = await estimateRequestRepository.findOrCreateAddress(fromAddressData);

    // 도착지 주소 생성 또는 검색
    const toAddressData = parseAddress(arrival);
    const toAddress = await estimateRequestRepository.findOrCreateAddress(toAddressData);

    // EstimateRequest 생성
    return await estimateRequestRepository.createEstimateRequest(
      {
        moveType: movingType.toUpperCase(),
        moveDate: movingDate,
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        description,
      },
      userId,
    );
  }

  async updateActiveEstimateRequest(id: string, updateData: TUpdateEstimateRequest) {
    const updatePayload: any = {};

    // moveType 업데이트
    if (updateData.movingType) {
      updatePayload.moveType = updateData.movingType.toUpperCase();
    }

    // moveDate 업데이트
    if (updateData.movingDate) {
      updatePayload.moveDate = new Date(updateData.movingDate);
    }

    // description 업데이트
    if (updateData.description !== undefined) {
      updatePayload.description = updateData.description;
    }

    // 주소 업데이트가 있는 경우
    if (updateData.departure || updateData.arrival) {
      const currentRequest = await estimateRequestRepository.getEstimateRequestById(id);
      if (!currentRequest) {
        throw new Error("견적 요청을 찾을 수 없습니다.");
      }

      // 주소 파싱 함수
      const parseAddress = (addressObj: any) => {
        const roadAddress = addressObj.roadAddress;
        console.log("업데이트 파싱할 주소:", roadAddress); // 디버깅용

        // 카카오 주소 API에서 오는 형태: "서울특별시 강남구 테헤란로 123"
        // 또는 "경기도 성남시 분당구 경부고속도로 409"

        // 주소를 공백으로 분리
        const parts = roadAddress.split(" ");
        console.log("업데이트 분리된 주소 부분들:", parts); // 디버깅용

        // 첫 번째 부분이 시/도인지 확인
        const firstPart = parts[0];
        console.log("업데이트 첫 번째 부분:", firstPart); // 디버깅용

        // 시/도 매핑이 가능한지 확인
        const mappedRegion = this.mapRegionToEnum(firstPart);
        console.log("업데이트 매핑된 지역:", mappedRegion); // 디버깅용

        // 매핑이 성공한 경우 (첫 번째 부분이 시/도인 경우)
        if (mappedRegion !== "SEOUL" || firstPart === "서울" || firstPart === "서울특별시") {
          if (parts.length >= 4) {
            // "서울특별시 강남구 역삼동 테헤란로 123" 형태
            const region = parts[0]; // 서울특별시
            const city = parts[1]; // 강남구
            const district = parts[2]; // 역삼동
            const detail = parts.slice(3).join(" ") + (addressObj.detailAddress ? ` ${addressObj.detailAddress}` : ""); // 테헤란로 123 21

            console.log("업데이트 파싱 결과 (4개 이상):", { region, city, district, detail }); // 디버깅용

            return {
              city,
              district,
              detail,
              region: this.mapRegionToEnum(region),
            };
          } else if (parts.length === 3) {
            // "서울특별시 강남구 테헤란로 123" 형태
            const region = parts[0]; // 서울특별시
            const city = parts[1]; // 강남구
            const district = ""; // 빈 문자열
            const detail = parts.slice(2).join(" ") + (addressObj.detailAddress ? ` ${addressObj.detailAddress}` : ""); // 테헤란로 123 21

            console.log("업데이트 파싱 결과 (3개):", { region, city, district, detail }); // 디버깅용

            return {
              city,
              district,
              detail,
              region: this.mapRegionToEnum(region),
            };
          } else if (parts.length === 2) {
            // "강원특별자치도 홍천군" 형태 - city에 다 넣지 말고 detail에 넣기
            const region = parts[0]; // 강원특별자치도
            const city = ""; // 빈 문자열로 설정
            const detail = parts[1] + (addressObj.detailAddress ? ` ${addressObj.detailAddress}` : ""); // 홍천군 1

            console.log("업데이트 파싱 결과 (2개):", { region, city, district: "", detail }); // 디버깅용

            return {
              city,
              district: "",
              detail,
              region: this.mapRegionToEnum(region),
            };
          }
        }

        // 매핑되지 않는 경우 기본값
        console.log("업데이트 매핑되지 않는 주소 형태, 기본값 사용");
        return {
          city: roadAddress,
          district: "",
          detail: addressObj.detailAddress || "",
          region: "SEOUL" as any,
        };
      };

      // 출발지 주소 업데이트
      if (updateData.departure) {
        const fromAddressData = parseAddress(updateData.departure);
        const fromAddress = await estimateRequestRepository.findOrCreateAddress(fromAddressData);
        updatePayload.fromAddressId = fromAddress.id;
      }

      // 도착지 주소 업데이트
      if (updateData.arrival) {
        const toAddressData = parseAddress(updateData.arrival);
        const toAddress = await estimateRequestRepository.findOrCreateAddress(toAddressData);
        updatePayload.toAddressId = toAddress.id;
      }
    }

    return await estimateRequestRepository.updateEstimateRequest(id, updatePayload);
  }

  async cancelActiveEstimateRequest(id: string) {
    return await estimateRequestRepository.cancelEstimateRequest(id);
  }

  // 한국 지역명을 enum으로 매핑
  private mapRegionToEnum(region: string): string {
    console.log("매핑할 지역명:", region); // 디버깅용

    const regionMap: { [key: string]: string } = {
      // 한국어 지역명
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
      강원특별자치도: "GANGWON",
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

      // 영어 지역명 (카카오 주소 API에서 오는 경우)
      SEOUL: "SEOUL",
      BUSAN: "BUSAN",
      DAEGU: "DAEGU",
      INCHEON: "INCHEON",
      GWANGJU: "GWANGJU",
      DAEJEON: "DAEJEON",
      ULSAN: "ULSAN",
      SEJONG: "SEJONG",
      GYEONGGI: "GYEONGGI",
      GANGWON: "GANGWON",
      CHUNGBUK: "CHUNGBUK",
      CHUNGNAM: "CHUNGNAM",
      JEONBUK: "JEONBUK",
      JEONNAM: "JEONNAM",
      GYEONGBUK: "GYEONGBUK",
      GYEONGNAM: "GYEONGNAM",
      JEJU: "JEJU",
    };

    const mappedRegion = regionMap[region];
    if (!mappedRegion) {
      console.warn(`매핑되지 않은 지역명: "${region}", 기본값 SEOUL 사용`);
    } else {
      console.log(`지역명 매핑: "${region}" -> "${mappedRegion}"`);
    }

    return mappedRegion || "SEOUL";
  }
}

export default EstimateRequestService;

import { Strategy as NaverStrategy } from "passport-naver";
import authService from "../../services/auth.service";

const naverStrategyOptions = {
  clientID: process.env.NAVER_CLIENT_ID!,
  clientSecret: process.env.NAVER_CLIENT_SECRET!,
  callbackURL: `${process.env.NODE_ENV === "production" ? process.env.PROD_URL : process.env.DEV_URL}/auth/naver/callback`,
  passReqToCallback: true,
};

async function verify(
  req: any,
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: any
) {
  try {
    // ✅ state에서 userType 복구
    let userType: "CUSTOMER" | "MOVER" = "CUSTOMER";

    try {
      const rawState = req.query.state;
      const decoded = decodeURIComponent(rawState);
      const parsed = JSON.parse(decoded);
      if (parsed.userType === "CUSTOMER" || parsed.userType === "MOVER") {
        userType = parsed.userType;
      }
    } catch (e) {
      console.warn("⚠️ state 파싱 실패:", req.query.state);
    }

    const email = profile._json?.email ?? "";
    const name = profile._json?.nickname ?? "";

    const user = await authService.oauthCrateOrUpdate(
      profile.provider?.toUpperCase?.() ?? "NAVER",
      profile.id,
      email,
      name,
      userType
    );

    done(null, { ...user, userType });
  } catch (error) {
    console.error("❌ 네이버 verify 함수 전체 에러:", error);
    done(error);
  }
}

const naverStrategy = new NaverStrategy(naverStrategyOptions, verify);
export default naverStrategy;

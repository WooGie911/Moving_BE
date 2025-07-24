import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import authService from "../../services/auth.service";

// googleStrategy.ts
const googleStrategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.NODE_ENV === "production" ? process.env.PROD_URL : process.env.DEV_URL}/auth/google/callback`,
  passReqToCallback: true, // 👈 이걸 추가해야 함
};

async function verify(
  req: any,
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: any
) {
  try {
    console.log("🔍 Profile 객체:", profile);
    console.log("🔍 Profile provider:", profile?.provider);

    const state = JSON.parse(req.query.state || "{}");
    const userType = state.userType;

    // 안전하게 provider 처리
    const provider = profile?.provider?.toUpperCase() || "GOOGLE";

    const user = await authService.oauthCrateOrUpdate(
      provider,
      profile.id,
      profile.emails[0].value,
      profile.displayName,
      userType
    );

    done(null, { ...user, userType });
  } catch (error) {
    console.error("❌ Verify 함수 에러:", error);
    done(error);
  }
}

const googleStrategy = new GoogleStrategy(googleStrategyOptions, verify);

export default googleStrategy;

import { Strategy as KakaoStrategy } from "passport-kakao";

import authService from "../../services/auth.service";

const kakaoStrategyOptions = {
  clientID: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  callbackURL: `${process.env.NODE_ENV === "production" ? process.env.PROD_URL : process.env.DEV_URL}/auth/kakao/callback`,
  passReqToCallback: true, // 👈 이걸 추가해야 함
};

async function verify(
  req: any,
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: any
) {
  const state = JSON.parse(req.query.state || "{}");
  const userType = state.userType;

  // 안전하게 provider 처리
  const provider = profile?.provider?.toUpperCase() || "KAKAO";

  const user = await authService.oauthCrateOrUpdate(
    provider,
    profile.id.toString(),
    profile._json.kakao_account.email, // 이메일은 여기서 가져옵니다
    profile.displayName || profile._json.properties.nickname, // 닉네임은 여기서 가져옵니다
    userType
  );

  done(null, { ...user, userType });
}

const kakaoStrategy = new KakaoStrategy(kakaoStrategyOptions, verify);

export default kakaoStrategy;

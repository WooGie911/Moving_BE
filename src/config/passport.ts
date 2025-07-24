import passport from "passport";
import localStrategy from "../middlewares/passport/localStrategy";
import googleStrategy from "../middlewares/passport/googleStrategy";
import jwtStrategy from "../middlewares/passport/jwtStrategy";
import authRepository from "../repositories/auth.repository";
import kakaoStrategy from "../middlewares/passport/kakaoStrategy";

passport.use(localStrategy);

passport.use("access-token", jwtStrategy.accessTokenStrategy);
passport.use("refresh-token", jwtStrategy.refreshTokenStrategy);

passport.use("google", googleStrategy);
passport.use("kakao", kakaoStrategy);

// 세션 저장 시 req.session 에 user.id 값을 할당합니다.
passport.serializeUser((user: any, done: any) => {
  done(null, user.id); // req.session.passport.user = user.id
});
/* 
{
  "세션ID": {
    "passport": {
      "user":  user.id // done(null, user.id)에서 전달된 값
    }
    // 기타 세션 데이터
  }
}
*/

// req.session.passport.user 값이 첫 번째 매개변수인 id에 할당됩니다.
passport.deserializeUser(async (id: string, done: any) => {
  try {
    // id를 이용해 사용자 정보를 조회
    const user = await authRepository.findUserById(id);
    done(null, user); // req.user = user;
  } catch (error) {
    done(error);
  }
});

export default passport;

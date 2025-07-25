import { Strategy as LocalStrategy } from "passport-local";
import authService from "../../services/auth.service";
import { TUserRole } from "../../types/user.types";

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
  },
  async (email: string, password: string, userType: TUserRole, done: any) => {
    try {
      const user = await authService.signin(email, password, userType);
      if (!user) {
        return done(null, false); // req.isAuthenticated() = false
      }
      return done(null, user); // req.user = user; req.isAuthenticated() = true
    } catch (error) {
      return done(error); // DB 오류 발생시 에러 반환
    }
  }
);

export default localStrategy;

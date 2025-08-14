import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from "passport-jwt";
import authRepository from "../../repositories/auth.repository";

const accessTokenOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
};

const cookieExtractor = function (req: any) {
  var token = null;
  if (req && req.cookies) {
    token = req.cookies["refreshToken"];
  }
  return token;
};

const refreshTokenOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET_KEY,
};

async function jwtVerify(payload: any, done: any) {
  try {
    const user = await authRepository.findUserById(payload.userId);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}

const accessTokenStrategy = new JwtStrategy(
  accessTokenOptions as StrategyOptionsWithoutRequest,
  jwtVerify
);
const refreshTokenStrategy = new JwtStrategy(
  refreshTokenOptions as StrategyOptionsWithoutRequest,
  jwtVerify
);

export default {
  accessTokenStrategy,
  refreshTokenStrategy,
};

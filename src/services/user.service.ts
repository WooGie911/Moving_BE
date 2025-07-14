import { getUserById } from "../repositories/user.repository";
import { NotFoundError } from "../types/commonError.types";

const userInfo = async (userId: number) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError("존재하지 않는 유저입니다");
  }

  return user;
};

export { userInfo };

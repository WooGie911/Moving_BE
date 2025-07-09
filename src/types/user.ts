export type TUser = {
  id: number; // 추후 uuid로 변경?
  email: string;
  name: string;
  encryptedPassword: string;
  encryptedPhoneNumber: string;
  currentRole: "CUSTOMER" | "MOVER";
};

export type TUserTokenCreate = Pick<TUser, "id" | "name" | "currentRole">;

export type TUserSignupInput = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  currentRole: "CUSTOMER" | "MOVER";
};

export type TUserSignup = Omit<TUser, "id">;

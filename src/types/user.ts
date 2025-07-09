export type TUser = {
  id: number; // 추후 uuid로 변경?
  email: string;
  name: string;
  encryptedPassword: string;
  encryptedPhoneNumber: string;
  currentRole: "CUSTOMER" | "MOVER";
};

export type TUserTokenCreate = {
  id: number;
  name: string;
  currentRole: "CUSTOMER" | "MOVER";
};

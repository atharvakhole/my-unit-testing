import crypto from "crypto";
type user = {
  email: string;
  passwordHash: string;
};

export const users = new Map<string, user>();

export const hashPassword = (password: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
};

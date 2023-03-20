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

export const credentialsAreValid = (username: string, password: string) => {
  const userExists = users.has(username);
  if (!userExists) return false;

  const currentPasswordHash = users.get(username)?.passwordHash;
  return hashPassword(password) === currentPasswordHash;
};

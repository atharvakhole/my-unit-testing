import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
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

export const authenticationMiddleware = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const credentials = Buffer.from(
      authHeader!?.slice("basic".length + 1),
      "base64"
    ).toString();
    console.log(credentials);

    const [username, password] = credentials.split(":");

    if (!credentialsAreValid(username, password)) {
      throw new Error("invalid credentials");
    }
  } catch (e) {
    res.status(401).send({ message: "please provide valid credentials" });
    return;
  }

  await next();
};

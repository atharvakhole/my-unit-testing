import crypto from "crypto";
import { NextFunction } from "express";
require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const hashPassword = (password: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
};

export const credentialsAreValid = async (
  username: string,
  password: string
) => {
  const user = await prisma.users.findFirst({
    where: {
      username: username,
    },
  });
  await prisma.$disconnect();

  if (!user) return false;

  return hashPassword(password) === user.passwordHash;

  // const userExists = users.has(username);
  // if (!userExists) return false;

  // const currentPasswordHash = users.get(username)?.passwordHash;
  // return hashPassword(password) === currentPasswordHash;
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

    const [username, password] = credentials.split(":");
    const validCredentialsSent = await credentialsAreValid(username, password);

    if (!validCredentialsSent) {
      throw new Error("invalid credentials");
    }
  } catch (e) {
    res.status(401).send({ message: "please provide valid credentials" });
    console.log("please provide valid credentials");

    return;
  }

  await next();
};

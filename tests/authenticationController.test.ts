import crypto from "crypto";
import {
  credentialsAreValid,
  hashPassword,
  authenticationMiddleware,
} from "../middleware/authenticationController";
require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const deleteAllUsers = async () => {
  await prisma.$queryRawUnsafe("Truncate users restart identity cascade");
  await prisma.$disconnect();
};

type response = {
  status: ((status: number) => void) | number;
  send: (body: any) => void;
  body: any;
};

afterEach(async () => {
  deleteAllUsers();
  await prisma.$disconnect();
});

describe("hashPassword", () => {
  afterEach(async () => await prisma.$disconnect());
  test("hashing passwwords", () => {
    const plainTextPassword = "password_example";
    const hash = crypto.createHash("sha256");

    hash.update(plainTextPassword);
    const expectedHash = hash.digest("hex");
    const actualHash = hashPassword(plainTextPassword);
    expect(actualHash).toBe(expectedHash);
  });
});

describe("credentialsAreValid", () => {
  afterEach(async () => await prisma.$disconnect());
  test("validating credentials", async () => {
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: hashPassword("a_password"),
      },
    });

    const hasValidCredentials = await credentialsAreValid(
      "test_user",
      "a_password"
    );
    expect(hasValidCredentials).toBe(true);
  });
});

describe("authenticationMiddleware", () => {
  beforeEach(async () => await deleteAllUsers());
  afterEach(async () => await prisma.$disconnect());
  test("returning an error if the credentials are not valid", async () => {
    const fakeAuth = Buffer.from("invalid:credentials").toString("base64");

    // mock request object
    const req = {
      headers: {
        authorization: `Basic ${fakeAuth}`,
      },
    };

    // mock response object
    const res: response = {
      status: function (status: number) {
        this.status = status;
        return this;
      },
      send(body: any) {
        this.body = body;
      },
      body: {},
    };

    const next = jest.fn();
    await authenticationMiddleware(req, res, next);
    expect(next.mock.calls).toHaveLength(0);
    expect(res.status).toEqual(401);
    expect(res.body).toEqual({ message: "please provide valid credentials" });
  });

  test("calling next() when credentials are valid", async () => {
    const auth = Buffer.from("test_user:a_password").toString("base64");
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: hashPassword("a_password"),
      },
    });

    // mock request object
    const req = {
      headers: {
        authorization: `Basic ${auth}`,
      },
    };

    // mock response object
    const res: response = {
      status: function (status: number) {
        this.status = status;
        return this;
      },
      send(body: any) {
        this.body = body;
      },
      body: {},
    };

    const next = jest.fn();
    await authenticationMiddleware(req, res, next);
    expect(next.mock.calls.length).toEqual(1);
  });
});

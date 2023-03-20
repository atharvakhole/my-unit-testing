import crypto from "crypto";
import {
  users,
  credentialsAreValid,
  hashPassword,
} from "../middleware/authenticationController";

afterEach(() => users.clear());

describe("hashPassword", () => {
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
  test("validating credentials", () => {
    users.set("test_user", {
      email: "test_user@example.org",
      passwordHash: hashPassword("a_password"),
    });

    const hasValidCredentials = credentialsAreValid("test_user", "a_password");
    expect(hasValidCredentials).toBe(true);
  });
});

import { server as app } from "../server";
import { carts } from "../controllers/cartController";
import { inventory } from "../controllers/inventoryController";
import request from "supertest";
import { users, hashPassword } from "../middleware/authenticationController";

afterAll(() => app.close());

describe("add items to a cart", () => {
  beforeEach(() => {
    inventory.clear();
    carts.clear();
  });

  test("adding available items", async () => {
    inventory.set("cheesecake", 3);

    const response = await request(app)
      .post("/carts/test_user/items")
      .send({ item: "cheesecake", quantity: 3 })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      cart: ["cheesecake", "cheesecake", "cheesecake"],
    });
    expect(inventory.get("cheesecake")).toEqual(0);
    expect(carts).toEqual(
      new Map([["test_user", ["cheesecake", "cheesecake", "cheesecake"]]])
    );
  });

  test("adding unavailable items", async () => {
    inventory.set("cheesecake", 0);

    const response = await request(app)
      .post("/carts/test_user/items")
      .send({ item: "cheesecake", quantity: 3 })
      .expect(400);

    expect(await response.body).toEqual({
      message: "cheesecake is unavailable",
    });
    expect(inventory.get("cheesecake")).toEqual(0);
    expect(carts).toEqual(new Map());
  });
});

describe("retrieve user cart", () => {
  beforeEach(() => {
    inventory.clear();
    carts.clear();
  });

  test("returns correct cart for existing user", async () => {
    carts.set("test_user", ["cheesecake", "brownie"]);

    const response = await request(app)
      .get("/carts/test_user/items")
      .expect(200);

    expect(await response.body).toEqual({
      cart: ["cheesecake", "brownie"],
    });
  });

  test("request fails with an error for non-existing user", async () => {
    carts.set("test_user", ["cheesecake", "brownie"]);
    const response = await request(app)
      .get("/carts/unknown_user/items")
      .expect(404);

    expect(await response.body).toEqual({ message: "User not found" });
  });
});

describe("delete items from cart", () => {
  beforeEach(() => {
    inventory.clear();
    carts.clear();
  });

  test("returns correct cart upon removing valid item", async () => {
    inventory.set("macaroon", 0);
    carts.set("test_user", ["cheesecake", "brownie", "macaroon"]);

    const response = await request(app)
      .delete("/carts/test_user/items/macaroon")
      .expect(200);

    expect(await response.body).toEqual({ cart: ["cheesecake", "brownie"] });
    expect(inventory.get("macaroon")).toEqual(1);
    expect(carts).toEqual(new Map([["test_user", ["cheesecake", "brownie"]]]));
  });

  test("request fails with an error for non-existing user", async () => {
    const response = await request(app)
      .delete("/carts/unknown_user/items/cheesecake")
      .expect(404);

    expect(response.body).toEqual({ message: "User not found" });
  });

  test("request fails with an error for non-existing cart item", async () => {
    inventory.set("cheesecake", 0);
    carts.set("test_user", ["cheesecake"]);

    const response = await request(app)
      .delete("/carts/test_user/items/brownie")
      .expect(400);

    expect(response.body).toEqual({ message: "brownie is not in the cart" });
    expect(carts).toEqual(new Map([["test_user", ["cheesecake"]]]));
    expect(inventory).toEqual(new Map([["cheesecake", 0]]));
  });
});

describe("create accounts", () => {
  afterEach(() => users.clear());

  test("creating a new account", async () => {
    const response = await request(app)
      .put("/users/test_user")
      .send({ email: "test_user@example.org", password: "a_password" })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      message: "test_user created successfully",
    });
  });

  test("request fails when attempting to create duplicate user", async () => {
    users.set("test_user", {
      email: "test_user@example.org",
      passwordHash: "a_password",
    });

    const response = await request(app)
      .put("/users/test_user")
      .send({ email: "test_user@blehbleh", password: "hello" })
      .expect(409)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      message: "test_user already exists",
    });
    expect(users).toEqual(
      new Map<string, { email: string; passwordHash: string }>([
        [
          "test_user",
          { email: "test_user@example.org", passwordHash: "a_password" },
        ],
      ])
    );
  });
});

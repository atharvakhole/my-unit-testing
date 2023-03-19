import { server as app, carts, inventory } from "../server";
import axios from "axios";

const apiRoot = "http://localhost:3000";

afterAll(() => app.close());

describe("add items to a cart", () => {
  beforeEach(() => {
    inventory.clear();
    carts.clear();
  });

  test("adding available items", async () => {
    inventory.set("cheesecake", 1);

    const response = await axios.post(
      `${apiRoot}/carts/test_user/items/cheesecake`
    );

    expect(response.status).toEqual(200);
    expect(await response.data).toEqual({ cart: ["cheesecake"] });
    expect(inventory.get("cheesecake")).toEqual(0);
    expect(carts).toEqual(new Map([["test_user", ["cheesecake"]]]));
  });

  test("adding unavailable items", async () => {
    inventory.set("cheesecake", 0);

    let response;

    try {
      response = await axios.post(
        `${apiRoot}/carts/test_user/items/cheesecake`
      );
    } catch (error: any) {
      response = error.response;
    }

    expect(response.status).toEqual(400);
    expect(await response.data).toEqual({
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

    const response = await axios.get(`${apiRoot}/carts/test_user/items`);

    expect(response.status).toEqual(200);
    expect(await response.data).toEqual({
      cart: ["cheesecake", "brownie"],
    });
  });

  test("request fails with an error for non-existing user", async () => {
    carts.set("test_user", ["cheesecake", "brownie"]);
    let response;

    try {
      response = await axios.get(`${apiRoot}/carts/unknown_user/items`);
    } catch (error: any) {
      response = error.response;
    }

    expect(response.status).toEqual(404);
    expect(await response.data).toEqual({ message: "User not found" });
  });
});

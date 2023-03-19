import { server as app } from "../server";
import { carts } from "../controllers/cartController";
import { inventory } from "../controllers/inventoryController";
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

describe("delete items from cart", () => {
  beforeEach(() => {
    inventory.clear();
    carts.clear();
  });

  test("returns correct cart upon removing valid item", async () => {
    inventory.set("macaroon", 0);
    carts.set("test_user", ["cheesecake", "brownie", "macaroon"]);

    const response = await axios.delete(
      `${apiRoot}/carts/test_user/items/macaroon`
    );

    expect(response.status).toEqual(200);
    expect(await response.data).toEqual({ cart: ["cheesecake", "brownie"] });
    expect(inventory.get("macaroon")).toEqual(1);
    expect(carts).toEqual(new Map([["test_user", ["cheesecake", "brownie"]]]));
  });

  test("request fails with an error for non-existing user", async () => {
    let response;

    try {
      response = await axios.delete(
        `${apiRoot}/carts/unknown_user/items/cheesecake`
      );
    } catch (e: any) {
      response = e.response;
    }

    expect(response.status).toEqual(404);
    expect(response.data).toEqual({ message: "User not found" });
  });

  test("request fails with an error for non-existing cart item", async () => {
    inventory.set("cheesecake", 0);
    carts.set("test_user", ["cheesecake"]);

    let response;

    try {
      response = await axios.delete(`${apiRoot}/carts/test_user/items/brownie`);
    } catch (e: any) {
      response = e.response;
    }

    expect(response.status).toEqual(400);
    expect(response.data).toEqual({ message: "brownie is not in the cart" });
    expect(carts).toEqual(new Map([["test_user", ["cheesecake"]]]));
    expect(inventory).toEqual(new Map([["cheesecake", 0]]));
  });
});

import { server as app, inventory } from "../server";
import axios from "axios";

const apiRoot = "http://localhost:3000";

afterAll(() => app.close());
afterEach(() => inventory.clear());

describe("add items to a cart", () => {
  test("adding available items", async () => {
    inventory.set("cheesecake", 1);

    const response = await axios.post(
      `${apiRoot}/carts/test_user/items/cheesecake`
    );

    expect(response.status).toEqual(200);
    expect(await response.data).toEqual({ cart: ["cheesecake"] });
    expect(inventory.get("cheesecake")).toEqual(0);
  });
});

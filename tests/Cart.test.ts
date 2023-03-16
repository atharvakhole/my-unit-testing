import { createNewCart, getCart, deleteAllCarts } from "../script";

describe("A new cart is created for every user", () => {
  beforeEach(async () => {
    await deleteAllCarts();
  });
  test("The createNewUser function creates a valid new user in DB", async () => {
    await createNewCart("Atharva2");
    let userReturned = getCart("Atharva2");

    expect(userReturned).resolves.toEqual({
      id: 1,
      username: "Atharva2",
    });
  });
});

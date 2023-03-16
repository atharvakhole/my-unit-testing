import {
  getAllCarts,
  removeCart,
  createNewCart,
  getCart,
  deleteAllCarts,
} from "../script";

// Ideally, you'd want to define deleteAllCarts as a utility function
// inside this test suite as it won't be a function that gets used in the application
// and so that it doest get modified accidentally, outside this file

describe("A new cart is created for every user", () => {
  beforeEach(async () => {
    await deleteAllCarts();
  });
  test("The createNewCart function creates a valid new user in DB", async () => {
    await createNewCart("Atharva2");
    const userReturned = await getCart("Atharva2");

    expect(userReturned).toEqual({
      id: 1,
      username: "Atharva2",
    });
  });

  test("The removeCart function deletes a given user from DB", async () => {
    await createNewCart("User1");
    await createNewCart("User2");
    await createNewCart("User3");

    await removeCart(3);

    const expectedCarts = [
      { id: 1, username: "User1" },
      { id: 2, username: "User2" },
    ];
    const cartsReturned = await getAllCarts();

    expect(cartsReturned).toEqual(expectedCarts);
  });
});

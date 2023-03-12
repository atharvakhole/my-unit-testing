import { createNewCart, getCarts } from "../script";

test("The createNewUser function creates a valid new user in DB", async () => {
  await createNewCart("Atharva2");
  let userReturned = getCarts("Atharva2");

  expect(userReturned).resolves.toEqual({});
});

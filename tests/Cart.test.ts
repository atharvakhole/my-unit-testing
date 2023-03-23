import { getAllCarts, removeCart, createNewCart, getCart } from "../script";
import Cart from "../Cart";
import { logger } from "../logger";

require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Ideally, you'd want to define deleteAllCarts as a utility function
// inside this test suite as it won't be a function that gets used in the application
// and so that it doest get modified accidentally, outside this file
afterAll(async () => {
  await prisma.cart_items.deleteMany();
  await prisma.carts.deleteMany();
  await prisma.users.deleteMany();
  await prisma.inventory.deleteMany();

  // Reset the ID sequence for the `cart_items` table
  await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  await prisma.$disconnect();
});

describe("A new cart is created for every user", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });
  test("The createNewCart function creates a valid new user in DB", async () => {
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
      },
    });

    await createNewCart("test_user");
    const usersState = await prisma.users.findMany({
      include: {
        carts: {
          include: {
            cart_items: { select: { itemName: true, quantity: true } },
          },
        },
      },
    });

    expect(usersState).toEqual([
      {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: [
          {
            username: "test_user",
            cart_items: [],
          },
        ],
      },
    ]);
  });

  test("The removeCart function deletes a given user from DB", async () => {
    await prisma.users.create({
      data: {
        username: "User1",
        email: "User1@example.org",
        passwordHash: "a_password",
        carts: { create: {} },
      },
    });
    await prisma.users.create({
      data: {
        username: "User2",
        email: "User1@example.org",
        passwordHash: "a_password",
        carts: { create: {} },
      },
    });
    await prisma.users.create({
      data: {
        username: "User3",
        email: "User1@example.org",
        passwordHash: "a_password",
        carts: { create: {} },
      },
    });

    await removeCart("User3");

    const expectedCarts = [{ username: "User1" }, { username: "User2" }];
    const cartsReturned = await prisma.carts.findMany();

    expect(cartsReturned).toEqual(expectedCarts);
  });
});

describe("logging new items", () => {
  const cart = new Cart();

  test("adding an item to cart calls the logger with the right arguments", () => {
    const mockLogger = jest.spyOn(logger, "logInfo");
    mockLogger.mockImplementation(() => {});
    cart.addToCart("cheesecake", 5);

    const firstCallArgs = mockLogger.mock.calls[0];
    const [firstArgs, SecondArgs] = firstCallArgs;

    expect(firstArgs).toEqual({ item: "cheesecake", quantity: 5 });
    expect(SecondArgs).toEqual("item added to the cart");
  });
});

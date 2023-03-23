import {
  getUserCart,
  addItemToCart,
  removeItemFromCart,
} from "../controllers/cartController";
require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.cart_items.deleteMany();
  await prisma.carts.deleteMany();
  await prisma.users.deleteMany();
  await prisma.inventory.deleteMany();

  // Reset the ID sequence for the `cart_items` table
  await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
});

describe("getUserCart", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });
  test("retrieves correct cart for existing user", async () => {
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: {
          create: {
            cart_items: {
              create: [
                { itemName: "cheesecake", quantity: 3 },
                { itemName: "brownie", quantity: 2 },
              ],
            },
          },
        },
      },
    });

    const userFromDB = await getUserCart("test_user");
    expect(userFromDB).toEqual({
      username: "test_user",
      cart_items: [
        { itemName: "cheesecake", quantity: 3, id: 1, cartUser: "test_user" },
        { itemName: "brownie", quantity: 2, id: 2, cartUser: "test_user" },
      ],
    });
  });
});

describe("addItemToCart", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });
  test("increments the quantity for an existing item in cart", async () => {
    await prisma.inventory.create({
      data: {
        itemName: "cheesecake",
        quantity: 4,
      },
    });
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: {
          create: {
            cart_items: {
              create: [
                { itemName: "cheesecake", quantity: 3 },
                { itemName: "brownie", quantity: 2 },
              ],
            },
          },
        },
      },
    });

    await addItemToCart("test_user", "cheesecake");

    const cartFromDB = await prisma.carts.findFirst({
      where: {
        username: "test_user",
      },
      include: {
        cart_items: { select: { itemName: true, quantity: true } },
      },
    });

    const inventory = await prisma.inventory.findMany();

    expect(cartFromDB).toEqual({
      username: "test_user",
      cart_items: [
        { itemName: "brownie", quantity: 2 },
        { itemName: "cheesecake", quantity: 4 },
      ],
    });
    expect(inventory).toEqual([{ itemName: "cheesecake", quantity: 3 }]);
  });

  test("creates new cart_item in inventory if it doesnt exist", async () => {
    await prisma.inventory.create({
      data: {
        itemName: "applepie",
        quantity: 4,
      },
    });
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: {
          create: {
            cart_items: {
              create: [
                { itemName: "cheesecake", quantity: 3 },
                { itemName: "brownie", quantity: 2 },
              ],
            },
          },
        },
      },
    });

    await addItemToCart("test_user", "applepie");

    const cartFromDB = await prisma.carts.findFirst({
      where: {
        username: "test_user",
      },
      include: {
        cart_items: { select: { itemName: true, quantity: true } },
      },
    });

    const inventory = await prisma.inventory.findMany();

    expect(cartFromDB).toEqual({
      username: "test_user",
      cart_items: [
        { itemName: "cheesecake", quantity: 3 },
        { itemName: "brownie", quantity: 2 },
        { itemName: "applepie", quantity: 1 },
      ],
    });
    expect(inventory).toEqual([{ itemName: "applepie", quantity: 3 }]);
  });

  test("throws error for non-existing user", async () => {
    await prisma.inventory.create({
      data: { itemName: "cheesecake", quantity: 1 },
    });
    let err;
    try {
      await addItemToCart("unknown_user", "cheesecake");
    } catch (e: any) {
      err = e;
    }

    const inventory = await prisma.inventory.findMany();

    expect(err).toEqual({
      message: "User with username unknown_user not found",
      code: 404,
    });
    expect(inventory).toEqual([{ itemName: "cheesecake", quantity: 1 }]);
  });

  test("throws error when cart is missing from user", async () => {
    await prisma.inventory.create({
      data: { itemName: "cheesecake", quantity: 1 },
    });
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
      },
    });
    let err;
    try {
      await addItemToCart("test_user", "cheesecake");
    } catch (e: any) {
      err = e;
    }

    const inventoryState = await prisma.inventory.findMany();
    const usersState = await prisma.users.findMany();

    expect(err).toEqual({
      message: "User with username test_user does not have a cart",
      code: 400,
    });
    expect(inventoryState).toEqual([{ itemName: "cheesecake", quantity: 1 }]);
    expect(usersState).toEqual([
      {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
      },
    ]);
  });
});

describe("removeItemFromCart", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  test("decrements the quantity of existing cart_item", async () => {
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: {
          create: {
            cart_items: {
              create: [
                { itemName: "cheesecake", quantity: 3 },
                { itemName: "brownie", quantity: 2 },
              ],
            },
          },
        },
      },
    });

    await removeItemFromCart("test_user", "cheesecake");

    const inventoryState = await prisma.inventory.findMany();
    const usersState = await prisma.users.findMany({
      include: {
        carts: {
          include: {
            cart_items: { select: { itemName: true, quantity: true } },
          },
        },
      },
    });

    expect(inventoryState).toEqual([{ itemName: "cheesecake", quantity: 1 }]);
    expect(usersState).toEqual([
      {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: [
          {
            username: "test_user",
            cart_items: [
              { itemName: "brownie", quantity: 2 },
              { itemName: "cheesecake", quantity: 2 },
            ],
          },
        ],
      },
    ]);
  });

  test("throws error for non-existing user", async () => {
    let err;
    try {
      await removeItemFromCart("unkown_user", "cheesecake");
    } catch (e: any) {
      err = e;
    }
    const inventoryState = await prisma.inventory.findMany();

    expect(err).toEqual({
      message: "User not found",
      code: 404,
    });
    expect(inventoryState).toEqual([]);
  });

  test("throws error for missing cart", async () => {
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
      },
    });
    let err;

    try {
      await removeItemFromCart("test_user", "cheesecake");
    } catch (e: any) {
      err = e;
    }

    const inventoryState = await prisma.inventory.findMany();
    const usersState = await prisma.users.findMany({
      include: {
        carts: {
          include: {
            cart_items: { select: { itemName: true, quantity: true } },
          },
        },
      },
    });

    expect(err).toEqual({
      message: "cheesecake is not in the cart",
      code: 400,
    });
    expect(inventoryState).toEqual([]);
    expect(usersState).toEqual([
      {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: [],
      },
    ]);
  });

  test("throws error for missing cart_item", async () => {
    await prisma.users.create({
      data: {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: { create: {} },
      },
    });
    let err;

    try {
      await removeItemFromCart("test_user", "cheesecake");
    } catch (e: any) {
      err = e;
    }

    const inventoryState = await prisma.inventory.findMany();
    const usersState = await prisma.users.findMany({
      include: {
        carts: {
          include: {
            cart_items: { select: { itemName: true, quantity: true } },
          },
        },
      },
    });

    expect(err).toEqual({
      message: "cheesecake is not in the cart",
      code: 400,
    });
    expect(inventoryState).toEqual([]);
    expect(usersState).toEqual([
      {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: "a_password",
        carts: [{ username: "test_user", cart_items: [] }],
      },
    ]);
  });
});

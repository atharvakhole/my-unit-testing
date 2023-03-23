import {
  removeFromInventory,
  addToInvetory,
} from "../controllers/inventoryController";
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

describe("removeFromInventory", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  test("subtracts 1 item from inventory", async () => {
    await prisma.inventory.create({
      data: {
        itemName: "cheesecake",
        quantity: 4,
      },
    });

    await removeFromInventory("cheesecake");

    const inventory = await prisma.inventory.findMany();

    expect(inventory).toEqual([{ itemName: "cheesecake", quantity: 3 }]);
  });

  test("throws error when item is out of stock", async () => {
    await prisma.inventory.create({
      data: {
        itemName: "cheesecake",
        quantity: 0,
      },
    });
    let err;

    try {
      await removeFromInventory("cheesecake");
    } catch (e: any) {
      err = e;
    }

    const inventory = await prisma.inventory.findMany();

    expect(inventory).toEqual([{ itemName: "cheesecake", quantity: 0 }]);
    expect(err).toEqual({ code: 400, message: "cheesecake is unavailable" });
  });

  test("throws error when item does not exist", async () => {
    let err;

    try {
      await removeFromInventory("cheesecake");
    } catch (e: any) {
      err = e;
    }

    const inventory = await prisma.inventory.findMany();

    expect(inventory).toEqual([]);
    expect(err).toEqual({ code: 400, message: "cheesecake is unavailable" });
  });
});

describe("addToInventory", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  test("create new item with when it does not exist in inventory", async () => {
    await addToInvetory("cheesecake");

    const inventory = await prisma.inventory.findMany();
    expect(inventory).toEqual([
      {
        itemName: "cheesecake",
        quantity: 1,
      },
    ]);
  });

  test("increments quantity for already existing item", async () => {
    await prisma.inventory.createMany({
      data: [
        { itemName: "cheesecake", quantity: 0 },
        { itemName: "brownie", quantity: 1 },
      ],
    });

    await addToInvetory("brownie");
    const inventory = await prisma.inventory.findMany();

    expect(inventory).toEqual([
      { itemName: "cheesecake", quantity: 0 },
      { itemName: "brownie", quantity: 2 },
    ]);
  });
});

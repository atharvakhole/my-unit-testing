import { server as app } from "../server";
import request from "supertest";
import { hashPassword } from "../middleware/authenticationController";
import axios from "axios";

require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const user = "test_user";
const password = "a_password";
const validAuth = Buffer.from(`${user}:${password}`).toString("base64");
const authHeader = `Basic ${validAuth}`;

const createUser = async () => {
  await prisma.users.create({
    data: {
      username: "test_user",
      email: "test_user@example.org",
      passwordHash: hashPassword(password),
    },
  });
};

afterAll(async () => {
  app.close();
  await prisma.cart_items.deleteMany();
  await prisma.carts.deleteMany();
  await prisma.users.deleteMany();
  await prisma.inventory.deleteMany();

  // Reset the ID sequence for the `cart_items` table
  await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  await prisma.$disconnect();
});

describe("post /carts/:username/items ", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  test("adding available items to existing cart", async () => {
    await prisma.inventory.create({
      data: {
        itemName: "cheesecake",
        quantity: 4,
      },
    });

    await createUser();

    await prisma.users.update({
      where: {
        username: "test_user",
      },
      data: {
        carts: { create: {} },
      },
    });

    const response = await request(app)
      .post("/carts/test_user/items")
      .set("authorization", authHeader)
      .send({ item: "cheesecake", quantity: 3 })
      .expect(200)
      .expect("Content-Type", /json/);

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

    expect(await response.body).toEqual({
      message: "Items added to cart",
    });
    expect(inventoryState).toEqual([{ itemName: "cheesecake", quantity: 1 }]);
    expect(usersState).toEqual([
      {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: hashPassword("a_password"),
        carts: [
          {
            username: "test_user",
            cart_items: [{ itemName: "cheesecake", quantity: 3 }],
          },
        ],
      },
    ]);
  });

  test("adding unavailable items", async () => {
    await prisma.inventory.create({
      data: {
        itemName: "cheesecake",
        quantity: 0,
      },
    });
    await createUser();
    await prisma.users.update({
      where: {
        username: "test_user",
      },
      data: {
        carts: { create: {} },
      },
    });
    const response = await request(app)
      .post("/carts/test_user/items")
      .set("authorization", authHeader)
      .send({ item: "cheesecake", quantity: 3 })
      .expect(400);

    const inventoryState = await prisma.inventory.findMany();
    const usersState = await prisma.users.findMany({
      select: {
        username: true,
        carts: {
          include: {
            cart_items: { select: { itemName: true, quantity: true } },
          },
        },
      },
    });
    expect(await response.body).toEqual({
      message: "cheesecake is unavailable",
    });
    expect(inventoryState).toEqual([{ itemName: "cheesecake", quantity: 0 }]);
    expect(usersState).toEqual([
      {
        username: "test_user",
        carts: [{ username: "test_user", cart_items: [] }],
      },
    ]);
  });
});

describe("retrieve user cart", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  test("returns correct cart for existing user", async () => {
    await createUser();
    await prisma.users.update({
      where: { username: "test_user" },
      data: {
        carts: {
          create: {
            cart_items: {
              create: { itemName: "brownie", quantity: 1 },
            },
          },
        },
      },
    });

    const response = await request(app)
      .get("/carts/test_user/items")
      .set("authorization", authHeader)
      .expect(200);

    expect(await response.body).toEqual({
      cart_items: [
        {
          cartUser: "test_user",
          id: 1,
          itemName: "brownie",
          quantity: 1,
        },
      ],
      username: "test_user",
    });
  });

  test("request fails with an error for non-existing user", async () => {
    await createUser();
    const response = await request(app)
      .get("/carts/unknown_user/items")
      .set("authorization", authHeader)
      .expect(404);

    expect(await response.body).toEqual({ message: "User not found" });
  });
});

describe("delete items from cart", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  test("returns correct cart upon removing valid item", async () => {
    await createUser();
    await prisma.users.update({
      where: { username: "test_user" },
      data: {
        carts: {
          create: {
            cart_items: {
              createMany: {
                data: [
                  { itemName: "cheesecake", quantity: 1 },
                  { itemName: "macaroon", quantity: 1 },
                  { itemName: "brownie", quantity: 3 },
                ],
              },
            },
          },
        },
      },
    });
    await prisma.inventory.create({
      data: {
        itemName: "macaroon",
        quantity: 0,
      },
    });
    const response = await request(app)
      .delete("/carts/test_user/items/macaroon")
      .set("authorization", authHeader)
      .expect(200);

    const inventoryState = await prisma.inventory.findMany();

    const usersState = await prisma.users.findMany({
      select: {
        username: true,
        carts: {
          include: {
            cart_items: { select: { itemName: true, quantity: true } },
          },
        },
      },
    });
    expect(await response.body).toEqual({
      message: "Removed 1 macaroon from cart",
    });
    expect(inventoryState).toEqual([{ itemName: "macaroon", quantity: 1 }]);
    expect(usersState).toEqual([
      {
        username: "test_user",
        carts: [
          {
            cart_items: [
              { itemName: "cheesecake", quantity: 1 },
              { itemName: "brownie", quantity: 3 },
              { itemName: "macaroon", quantity: 0 },
            ],
            username: "test_user",
          },
        ],
      },
    ]);
  });

  test("request fails with an error for non-existing user", async () => {
    await createUser();
    const response = await request(app)
      .delete("/carts/unknown_user/items/cheesecake")
      .set("authorization", authHeader)
      .expect(404);

    expect(response.body).toEqual({ message: "User not found" });
  });

  test("request fails with an error for non-existing cart item", async () => {
    await prisma.inventory.create({
      data: {
        itemName: "cheesecake",
        quantity: 0,
      },
    });
    await createUser();
    await prisma.users.update({
      where: { username: "test_user" },
      data: {
        carts: {
          create: {
            cart_items: {
              create: {
                itemName: "cheesecake",
                quantity: 1,
              },
            },
          },
        },
      },
    });

    const inventoryState = await prisma.inventory.findMany();
    const usersState = await prisma.users.findMany({
      select: {
        username: true,
        carts: {
          include: {
            cart_items: { select: { itemName: true, quantity: true } },
          },
        },
      },
    });

    const response = await request(app)
      .delete("/carts/test_user/items/brownie")
      .set("authorization", authHeader)
      .expect(400);

    expect(response.body).toEqual({ message: "brownie is not in the cart" });
    expect(usersState).toEqual([
      {
        username: "test_user",
        carts: [
          {
            cart_items: [{ itemName: "cheesecake", quantity: 1 }],
            username: "test_user",
          },
        ],
      },
    ]);
    expect(inventoryState).toEqual([{ itemName: "cheesecake", quantity: 0 }]);
  });
});
describe("create accounts", () => {
  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  test("creating a new account", async () => {
    const response = await request(app)
      .put("/users/test_user2")
      .send({ email: "test_user2@example.org", password: "a_password" })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      message: "test_user2 created successfully",
    });
  });

  test("request fails when attempting to create duplicate user", async () => {
    await createUser();
    const response = await request(app)
      .put("/users/test_user")
      .send({ email: "test_user@differentmail.org", password: "hello" })
      .expect(409)
      .expect("Content-Type", /json/);

    const usersState = await prisma.users.findMany();

    expect(response.body).toEqual({
      message: "test_user already exists",
    });

    expect(usersState).toEqual([
      {
        username: "test_user",
        email: "test_user@example.org",
        passwordHash: hashPassword(password),
      },
    ]);
  });
});

describe("fetch inventory items", () => {
  const eggs = { itemName: "egg", quantity: 3 };
  const applepie = { itemName: "apple pie", quantity: 1 };

  beforeEach(async () => {
    await prisma.cart_items.deleteMany();
    await prisma.carts.deleteMany();
    await prisma.users.deleteMany();
    await prisma.inventory.deleteMany();

    // Reset the ID sequence for the `cart_items` table
    await prisma.$executeRaw`ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;`;
  });

  beforeEach(async () => {
    await prisma.inventory.createMany({ data: [eggs, applepie] });
  });

  test("can fetch an item from the inventory", async () => {
    const thirdPartyResponse = await axios.get(
      "https://www.themealdb.com/api/json/v1/1/filter.php?i=egg"
    );

    const { meals: recipes } = await thirdPartyResponse.data;
    const response = await request(app)
      .get(`/inventory/egg`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      ...eggs,
      recipes,
    });
  });
});

require("dotenv").config();

import { cart_items, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// carts table
export const deleteAllCarts = async () => {
  await prisma.$queryRawUnsafe("Truncate carts restart identity cascade");
  prisma.$disconnect();
};

export const createNewCart = async (username: string) => {
  const cartFromDB = await prisma.carts.findFirst({
    where: {
      username: username,
    },
  });

  const userFromDB = await prisma.users.findFirst({
    where: { username: username },
  });

  if (!userFromDB) {
    const err = {
      message: "User not found",
      code: 404,
    };
    throw err;
  }

  if (cartFromDB) {
    const err = {
      message: "Cart already exists",
      code: 409,
    };
    await prisma.$disconnect();
    throw err;
  }

  await prisma.users.update({
    where: { username: username },
    data: {
      carts: { create: {} },
    },
  });
  await prisma.$disconnect();
};

export const getCart = async (username: string) => {
  const user = await prisma.carts.findFirst({
    where: {
      username: username,
    },
  });

  if (!user) {
    const err = {
      message: "Cart not found",
      code: "404",
    };
  }
  await prisma.$disconnect();
  return user;
};

export const getAllCarts = async () => {
  const cartsMap = new Map<string, cart_items[]>();

  const carts = await prisma.carts.findMany();

  carts.map(async (cart) => {
    const cartItems = await prisma.cart_items.findMany({
      where: {
        cartUser: cart.username,
      },
    });

    cartsMap.set(cart.username, cartItems);
  });
  await prisma.$disconnect();
  return cartsMap;
};

export const removeCart = async (username: string) => {
  await prisma.cart_items.deleteMany({
    where: {
      cartUser: username,
    },
  });
  await prisma.carts.delete({
    where: {
      username: username,
    },
  });
  await prisma.$disconnect();
};

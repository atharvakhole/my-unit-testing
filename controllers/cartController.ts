import { addToInvetory, removeFromInventory } from "./inventoryController";
require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getUserCart = async (username: string) => {
  const cartFromDB = await prisma.carts.findFirst({
    where: { username: username },
    include: {
      cart_items: true,
    },
  });
  if (!cartFromDB) {
    const err = { message: "User not found", code: 404 };
    await prisma.$disconnect();
    throw err;
  }

  await prisma.$disconnect();
  return cartFromDB;
};

export const addItemToCart = async (username: string, itemName: string) => {
  const user = await prisma.users.findUnique({
    where: {
      username: username,
    },
  });
  if (!user) {
    const err = {
      message: `User with username ${username} not found`,
      code: 404,
    };
    await prisma.$disconnect();
    throw err;
  }

  // Check if the user has a cart
  const cart = await prisma.carts.findUnique({
    where: {
      username: username,
    },
  });
  if (!cart) {
    const err = {
      message: `User with username ${username} does not have a cart`,
      code: 400,
    };
    await prisma.$disconnect();
    throw err;
  }

  await removeFromInventory(itemName);

  // Check if the item is already in the user's cart
  const cartItem = await prisma.cart_items.findFirst({
    where: {
      cartUser: username,
      itemName: itemName,
    },
  });
  if (cartItem) {
    // If the item is already in the cart, increment the quantity
    await prisma.cart_items.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity: cartItem.quantity + 1,
      },
    });
  } else {
    // If the item is not in the cart, add it to the cart
    await prisma.cart_items.create({
      data: {
        itemName: itemName,
        quantity: 1,
        cart: {
          connect: {
            username: username,
          },
        },
      },
    });
  }
  await prisma.$disconnect();
};

export const removeItemFromCart = async (username: string, item: string) => {
  const userFromDB = await prisma.users.findFirst({
    where: {
      username: username,
    },
  });
  if (!userFromDB) {
    const err = { message: "User not found", code: 404 };
    await prisma.$disconnect();
    throw err;
  }
  const cartFromDB = await prisma.carts.findFirst({
    where: {
      username: username,
    },
  });
  const cartItemFromDB = await prisma.cart_items.findFirst({
    where: {
      cartUser: username,
      itemName: item,
    },
  });
  if (!cartFromDB || !cartItemFromDB) {
    const err = { message: `${item} is not in the cart`, code: 400 };
    await prisma.$disconnect();
    throw err;
  }

  await prisma.cart_items.update({
    where: {
      id: cartItemFromDB.id,
    },
    data: {
      quantity: cartItemFromDB.quantity - 1,
    },
  });
  await addToInvetory(item);
  await prisma.$disconnect();
};

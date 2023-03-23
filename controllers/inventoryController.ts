require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const removeFromInventory = async (item: string) => {
  const itemFromInventory = await prisma.inventory.findFirst({
    where: {
      itemName: item,
    },
  });
  const isAvailable = itemFromInventory && itemFromInventory.quantity > 0;
  if (!isAvailable) {
    const err: { message: string; code: number } = {
      message: `${item} is unavailable`,
      code: 400,
    };
    throw err;
  }

  await prisma.inventory.update({
    where: {
      itemName: item,
    },
    data: {
      quantity: itemFromInventory.quantity - 1,
    },
  });
};

export const addToInvetory = async (item: string) => {
  const itemFromInventory = await prisma.inventory.findFirst({
    where: { itemName: item },
  });
  if (itemFromInventory) {
    await prisma.inventory.update({
      where: {
        itemName: item,
      },
      data: {
        quantity: itemFromInventory.quantity + 1,
      },
    });
  } else
    await prisma.inventory.create({
      data: {
        itemName: item,
        quantity: 1,
      },
    });
};

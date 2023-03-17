require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// carts table
export const deleteAllCarts = async () => {
  await prisma.$queryRawUnsafe("Truncate carts restart identity cascade");
  prisma.$disconnect();
};

export const createNewCart = async (username: string) => {
  await prisma.carts.create({
    data: {
      username: username,
    },
  });
  prisma.$disconnect();
};

export const getCart = async (username: string) => {
  const user = await prisma.carts.findFirst({
    where: {
      username: username,
    },
  });
  prisma.$disconnect();
  return user;
};

export const getAllCarts = async () => {
  const carts = await prisma.carts.findMany();
  prisma.$disconnect();
  return carts;
};

export const removeCart = async (id: number) => {
  await prisma.carts.delete({
    where: {
      id: id,
    },
  });
  prisma.$disconnect();
};

// cart_items table

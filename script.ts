require("dotenv").config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createNewCart = async (username: string) => {
  await prisma.carts.create({
    data: {
      username: username,
    },
  });
  prisma.$disconnect();
};

export const getCarts = async (username: string) => {
  const user = await prisma.carts.findFirst({
    where: {
      username: username,
    },
  });
  return user;
};

export const removeCart = async (id: number) => {
  await prisma.carts.delete({
    where: {
      id: id,
    },
  });
};

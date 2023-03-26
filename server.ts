import express, { NextFunction, Request, Response } from "express";
import {
  addItemToCart,
  removeItemFromCart,
  getUserCart,
} from "./controllers/cartController";
import {
  hashPassword,
  authenticationMiddleware,
} from "./middleware/authenticationController";
const app = express();
const port = 3000;

require("dotenv").config();

import { PrismaClient } from "@prisma/client";
import axios from "axios";
const prisma = new PrismaClient();

app.use(express.json());
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith("/carts")) {
    return await authenticationMiddleware(req, res, next);
  }

  await next();
});

app.get("/inventory/:itemName", async (req, res) => {
  const { itemName } = req.params;
  const response = await axios.get(
    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${itemName}`
  );

  const { meals: recipes } = await response.data;
  const inventoryItem = await prisma.inventory.findUnique({
    where: { itemName: itemName },
  });

  const data = {
    ...inventoryItem,
    recipes,
  };

  if (!data) {
    res.status(404).send({ message: `${itemName} not found` });
    return;
  }

  res.send(data);
});

app.get("/carts/:username/items", async (req, res) => {
  try {
    const { username } = req.params;
    const cart = await getUserCart(username);

    res.send(cart);
  } catch (e: any) {
    res.status(e.code).send({ message: e.message });
  }
});

app.post("/carts/:username/items", async (req, res) => {
  const { username } = req.params;
  const { item, quantity }: { item: string; quantity: number } = req.body;

  for (let i = 0; i < quantity; i++) {
    try {
      await addItemToCart(username, item);
    } catch (e: any) {
      res.status(e.code).send({ message: e.message });
      return;
    }
  }
  res.send({ message: "Items added to cart" }).status(200);
});

app.delete("/carts/:username/items/:item", async (req, res) => {
  try {
    const { username, item } = req.params;
    await removeItemFromCart(username, item);
    res.send({ message: `Removed 1 ${item} from cart` });
  } catch (e: any) {
    res.status(e.code).send({ message: e.message });
    return;
  }
});

app.put("/users/:username", async (req, res) => {
  const { username } = req.params;
  const { email, password }: { email: string; password: string } = req.body;
  const userAlreadyExists = await prisma.users.findFirst({
    where: {
      username: username,
    },
  });
  if (userAlreadyExists) {
    res.status(409).send({ message: `${username} already exists` });
    return;
  }

  await prisma.users.create({
    data: {
      username: username,
      email: email,
      passwordHash: hashPassword(password),
    },
  });
  return res.send({ message: `${username} created successfully` });
});

export const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

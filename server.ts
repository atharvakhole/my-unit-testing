import express from "express";
import { json } from "stream/consumers";
import {
  addItemToCart,
  removeItemFromCart,
  getUserCart,
} from "./controllers/cartController";
const app = express();
const port = 3000;

app.use(express.json());

app.get("/carts/:username/items", (req, res) => {
  try {
    const { username } = req.params;
    const cart = getUserCart(username);
    res.send({ cart: cart });
  } catch (e: any) {
    res.status(e.code).send({ message: e.message });
  }
});

app.post("/carts/:username/items", (req, res) => {
  const { username } = req.params;
  const { item, quantity }: { item: string; quantity: number } = req.body;
  let newItems;

  for (let i = 0; i < quantity; i++) {
    try {
      newItems = addItemToCart(username, item);
    } catch (e: any) {
      res.status(e.code).send({ message: e.message });
      return;
    }
  }
  res.send({ cart: newItems });
});

app.delete("/carts/:username/items/:item", (req, res) => {
  try {
    const { username, item } = req.params;
    const newItems = removeItemFromCart(username, item);
    res.send({ cart: newItems });
  } catch (e: any) {
    res.status(e.code).send({ message: e.message });
    return;
  }
});

export const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

import express from "express";
import {
  carts,
  addItemToCart,
  removeItemFromCart,
  getUserCart,
} from "./controllers/cartController";
const app = express();
const port = 3000;

app.get("/carts/:username/items", (req, res) => {
  try {
    const { username } = req.params;
    const cart = getUserCart(username);
    res.send({ cart: cart });
  } catch (e: any) {
    res.status(e.code).send({ message: e.message });
  }
});

app.post("/carts/:username/items/:item", (req, res) => {
  try {
    const { username, item } = req.params;
    const newItems = addItemToCart(username, item);
    res.send({ cart: newItems });
  } catch (e: any) {
    res.status(e.code).send({ message: e.message });
    return;
  }
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

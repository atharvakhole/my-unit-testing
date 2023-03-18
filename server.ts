import express from "express";
const app = express();
const port = 3000;

let carts = new Map<string, string[]>();
export let inventory = new Map<string, number>();

app.get("/carts/:username/items", (req, res) => {
  const cart = carts.get(req.params.username);
  cart ? res.send({ cart: cart }) : res.status(404);
});

app.post("/carts/:username/items/:item", (req, res) => {
  const { username, item } = req.params;
  const isAvailable = inventory.has(item) && inventory.get(item)! > 0;

  if (!isAvailable) {
    res.send({ message: `${item} is unavailable` });
    res.status(400);
    return;
  }

  const newItems = (carts.get(username) || []).concat(item);
  carts.set(username, newItems);
  inventory.set(item, inventory.get(item)! - 1);
  res.send({ cart: newItems });
});

app.delete("/carts/:username/items/:item", (req, res) => {
  const { username, item } = req.params;
  if (!carts.has(username) || !carts.get(username)?.includes(item)) {
    res.send({
      message: `${item} is not in the cart`,
    });
    res.status(400);
    return;
  }

  const newItems = (carts.get(username) || []).filter((i) => i !== item);
  inventory.set(item, (inventory.get(item) || 0) + 1);
  carts.set(username, newItems);
  res.send({ cart: newItems });
});

export const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

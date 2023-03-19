import express from "express";
const app = express();
const port = 3000;

export let carts = new Map<string, string[]>();
export let inventory = new Map<string, number>();

app.get("/carts/:username/items", (req, res) => {
  if (carts.has(req.params.username)) {
    const cart = carts.get(req.params.username);
    res.send({ cart: cart });
  } else {
    res.status(404).send({ message: "User not found" });
  }
});

app.post("/carts/:username/items/:item", (req, res) => {
  const { username, item } = req.params;
  const isAvailable = inventory.has(item) && inventory.get(item)! > 0;

  if (!isAvailable) {
    res.status(400).send({ message: `${item} is unavailable` });
    return;
  }

  const newItems = (carts.get(username) || []).concat(item);
  carts.set(username, newItems);
  inventory.set(item, inventory.get(item)! - 1);
  res.send({ cart: newItems });
});

app.delete("/carts/:username/items/:item", (req, res) => {
  const { username, item } = req.params;
  if (!carts.has(username)) {
    res.status(404).send({ message: "User not found" });
    return;
  }
  if (!carts.get(username)?.includes(item)) {
    res.status(400).send({
      message: `${item} is not in the cart`,
    });
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

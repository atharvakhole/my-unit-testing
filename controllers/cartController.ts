import { addToInvetory, removeFromInventory } from "./inventoryController";

export const carts = new Map<string, string[]>();

export const getUserCart = (username: string) => {
  if (!carts.has(username)) {
    const err = { message: "User not found", code: 404 };
    throw err;
  }

  const cart = carts.get(username)!;
  return cart;
};

export const addItemToCart = (username: string, item: string) => {
  removeFromInventory(item);
  const newItems = (carts.get(username) || []).concat(item);
  carts.set(username, newItems);
  return newItems;
};

export const removeItemFromCart = (username: string, item: string) => {
  if (!carts.has(username)) {
    const err = { message: "User not found", code: 404 };
    throw err;
  }
  if (!carts.get(username)?.includes(item)) {
    const err = { message: `${item} is not in the cart`, code: 400 };
    throw err;
  }

  const newItems = (carts.get(username) || []).filter((i) => i !== item);
  addToInvetory(item);
  carts.set(username, newItems);
  return newItems;
};

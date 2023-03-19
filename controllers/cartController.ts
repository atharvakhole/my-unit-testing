import { removeFromInventory } from "./inventoryController";

export const carts = new Map<string, string[]>();

export const addItemToCart = (username: string, item: string) => {
  removeFromInventory(item);
  const newItems = (carts.get(username) || []).concat(item);
  carts.set(username, newItems);
  return newItems;
};

import { createNewCart, getCart } from "./script";
import { logger } from "./logger";

type item = {
  item: string;
  quantity: number;
};

export default class Cart {
  private _items: item[];
  constructor() {
    this._items = [];
  }

  get items() {
    return [...this._items];
  }

  addToCart(item: string, quantity: number) {
    const newItem: item = {
      item: item,
      quantity: quantity,
    };
    this._items = [...this._items, newItem];
    logger.logInfo({ item, quantity }, "item added to the cart");
  }

  removeFromCart(item: string) {
    for (let i = 0; i < this.items.length; i++) {
      const element = this.items[i];

      if (item === element.item) {
        this._items = [...this._items.slice(0, i), ...this._items.slice(i + 1)];
      }
    }
  }
}

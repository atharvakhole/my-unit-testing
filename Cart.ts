import { createNewCart, getCarts } from "./script";

class Cart {
  private _items: string[];
  constructor() {
    this._items = [];
  }

  get items() {
    return [...this._items];
  }

  addToCart(item: string) {
    this._items = [...this._items, item];
  }

  removeFromCart(item: string) {
    for (let i = 0; i < this.items.length; i++) {
      const element = this.items[i];

      if (item === element) {
        this._items = [...this._items.slice(0, i), ...this._items.slice(i + 1)];
      }
    }
  }
}

export default Cart;

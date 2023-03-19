export const inventory = new Map<string, number>();

export const removeFromInventory = (item: string) => {
  if (!inventory.has(item) || inventory.get(item)! <= 0) {
    const err: { message: string; code: number } = {
      message: `${item} is unavailable`,
      code: 400,
    };
    throw err;
  }

  inventory.set(item, inventory.get(item)! - 1);
};

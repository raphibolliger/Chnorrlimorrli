import { computed, effect, Injectable, signal } from '@angular/core';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  unitPriceRappen: number;
  imagePath: string | null;
  options: Record<string, string>;
  quantity: number;
}

const storageKey = 'chnorrlimorrli.cart';

export function cartItemKey(item: Pick<CartItem, 'productId' | 'options'>): string {
  const options = Object.keys(item.options)
    .sort()
    .map((name) => `${name}=${item.options[name]}`)
    .join('&');
  return `${item.productId}?${options}`;
}

function readStoredItems(): CartItem[] {
  try {
    const stored = globalThis.localStorage?.getItem(storageKey);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class Cart {
  private readonly state = signal<CartItem[]>(readStoredItems());

  readonly items = this.state.asReadonly();
  readonly count = computed(() => this.state().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotalRappen = computed(() =>
    this.state().reduce((sum, item) => sum + item.unitPriceRappen * item.quantity, 0),
  );

  constructor() {
    effect(() => {
      const items = this.state();
      try {
        globalThis.localStorage?.setItem(storageKey, JSON.stringify(items));
      } catch {
        return;
      }
    });
  }

  add(item: CartItem, maxQuantity: number): void {
    const key = cartItemKey(item);
    this.state.update((items) => {
      const existing = items.find((entry) => cartItemKey(entry) === key);
      if (existing) {
        return items.map((entry) =>
          entry === existing
            ? { ...entry, quantity: Math.min(entry.quantity + item.quantity, maxQuantity) }
            : entry,
        );
      }
      return [...items, { ...item, quantity: Math.min(item.quantity, maxQuantity) }];
    });
  }

  setQuantity(key: string, quantity: number): void {
    this.state.update((items) =>
      quantity <= 0
        ? items.filter((item) => cartItemKey(item) !== key)
        : items.map((item) => (cartItemKey(item) === key ? { ...item, quantity } : item)),
    );
  }

  remove(key: string): void {
    this.state.update((items) => items.filter((item) => cartItemKey(item) !== key));
  }

  replace(items: CartItem[]): void {
    this.state.set(items);
  }

  clear(): void {
    this.state.set([]);
  }
}

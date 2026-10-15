import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { maxLineQuantity } from '../../../supabase/functions/_shared/pricing';
import { ProductImage } from '../components/product-image';
import { Cart, CartItem, cartItemKey } from '../core/cart';
import { ChfPipe } from '../core/chf.pipe';
import { isSoldOut, maxOrderQuantity, Product, ShopApi } from '../core/shop-api';

interface CartLine {
  key: string;
  item: CartItem;
  product: Product | undefined;
  unavailable: boolean;
  maxQuantity: number;
}

@Component({
  selector: 'app-cart-page',
  imports: [KeyValuePipe, RouterLink, ProductImage, ChfPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.html',
})
export class CartPage {
  protected readonly cart = inject(Cart);
  private readonly shopApi = inject(ShopApi);

  private readonly products = signal<Map<string, Product> | null>(null);
  protected readonly refreshFailed = signal(false);

  protected readonly lines = computed<CartLine[]>(() => {
    const products = this.products();
    return this.cart.items().map((item) => {
      const product = products?.get(item.productId);
      const unavailable = products !== null && (!product || !product.active || isSoldOut(product));
      return {
        key: cartItemKey(item),
        item,
        product,
        unavailable,
        maxQuantity: product ? maxOrderQuantity(product) : maxLineQuantity,
      };
    });
  });
  protected readonly hasUnavailable = computed(() => this.lines().some((line) => line.unavailable));

  constructor() {
    afterNextRender(() => this.refresh());
  }

  protected changeQuantity(line: CartLine, delta: number): void {
    const quantity = Math.min(line.item.quantity + delta, line.maxQuantity);
    this.cart.setQuantity(line.key, quantity);
  }

  protected remove(line: CartLine): void {
    this.cart.remove(line.key);
  }

  private async refresh(): Promise<void> {
    try {
      const products = await this.shopApi.productsByIds([
        ...new Set(this.cart.items().map((item) => item.productId)),
      ]);
      const byId = new Map(products.map((product) => [product.id, product]));
      this.cart.replace(
        this.cart.items().map((item) => {
          const product = byId.get(item.productId);
          return product
            ? {
                ...item,
                name: product.name,
                unitPriceRappen: product.price_rappen,
                imagePath: product.product_images[0]?.storage_path ?? item.imagePath,
                quantity: Math.max(Math.min(item.quantity, maxOrderQuantity(product)), 1),
              }
            : item;
        }),
      );
      this.products.set(byId);
    } catch {
      this.refreshFailed.set(true);
    }
  }
}

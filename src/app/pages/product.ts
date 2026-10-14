import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ProductImage } from '../components/product-image';
import { Cart } from '../core/cart';
import { ChfPipe } from '../core/chf.pipe';
import { isSoldOut, maxOrderQuantity, ShopApi } from '../core/shop-api';

@Component({
  selector: 'app-product',
  imports: [RouterLink, ProductImage, ChfPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product.html',
})
export class ProductPage {
  readonly slug = input.required<string>();

  private readonly shopApi = inject(ShopApi);
  private readonly cart = inject(Cart);
  private readonly title = inject(Title);

  protected readonly product = resource({
    params: () => this.slug(),
    loader: async ({ params }) => {
      const product = await this.shopApi.product(params);
      if (product) {
        this.title.setTitle(`${product.name} – Chnorrlimorrli`);
      }
      return product;
    },
  });

  protected readonly selectedImage = linkedSignal(() => this.product.value()?.product_images[0]);
  protected readonly selectedOptions = linkedSignal<Record<string, string>>(() =>
    Object.fromEntries(
      (this.product.value()?.product_options ?? []).map((option) => [option.name, '']),
    ),
  );
  protected readonly quantity = linkedSignal<number>(() => (this.product.value() ? 1 : 0));
  protected readonly added = signal(false);

  protected readonly soldOut = computed(() => {
    const product = this.product.value();
    return product ? isSoldOut(product) : false;
  });
  protected readonly maxQuantity = computed(() => {
    const product = this.product.value();
    return product ? maxOrderQuantity(product) : 0;
  });
  protected readonly missingOptions = computed(() =>
    Object.entries(this.selectedOptions())
      .filter(([, value]) => !value)
      .map(([name]) => name),
  );
  protected readonly paragraphs = computed(() =>
    (this.product.value()?.description ?? '')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );

  protected selectOption(name: string, value: string): void {
    this.selectedOptions.update((options) => ({ ...options, [name]: value }));
    this.added.set(false);
  }

  protected changeQuantity(delta: number): void {
    this.quantity.update((quantity) => Math.min(Math.max(quantity + delta, 1), this.maxQuantity()));
    this.added.set(false);
  }

  protected addToCart(): void {
    const product = this.product.value();
    if (!product || this.soldOut() || this.missingOptions().length > 0) {
      return;
    }
    this.cart.add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        unitPriceRappen: product.price_rappen,
        imagePath: product.product_images[0]?.storage_path ?? null,
        options: this.selectedOptions(),
        quantity: this.quantity(),
      },
      this.maxQuantity(),
    );
    this.added.set(true);
  }
}

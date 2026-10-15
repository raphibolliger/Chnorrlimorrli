import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductImage } from '../components/product-image';
import { ProductAdminApi, ProductDraft, slugify } from './product-admin-api';
import {
  checkboxClass,
  dangerButtonClass,
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
  textButtonClass,
} from './ui/classes';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { AdminPageHeader } from './ui/page-header';
import { SectionCard } from './ui/section-card';

interface OptionDraft {
  name: string;
  choices: string;
}

@Component({
  selector: 'app-admin-product-edit',
  imports: [FormsModule, ProductImage, Icon, ListSkeleton, AdminPageHeader, SectionCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-edit.html',
})
export class AdminProductEdit {
  readonly id = input.required<string>();

  private readonly api = inject(ProductAdminApi);
  private readonly router = inject(Router);

  protected readonly isNew = computed(() => this.id() === 'neu');
  protected readonly product = resource({
    params: () => this.id(),
    loader: ({ params }) => (params === 'neu' ? Promise.resolve(null) : this.api.product(params)),
  });

  protected readonly name = signal('');
  protected readonly slug = signal('');
  protected readonly slugTouched = signal(false);
  protected readonly sku = signal('');
  protected readonly price = signal('');
  protected readonly shortDescription = signal('');
  protected readonly description = signal('');
  protected readonly active = signal(false);
  protected readonly sortOrder = signal(0);
  protected readonly trackStock = signal(false);
  protected readonly stock = signal<number | null>(null);
  protected readonly options = signal<OptionDraft[]>([]);

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly message = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);
  protected readonly confirmDelete = signal(false);

  protected readonly fieldClass = fieldClass;
  protected readonly textareaClass = textareaClass;
  protected readonly labelClass = labelClass;
  protected readonly hintClass = hintClass;
  protected readonly checkboxClass = checkboxClass;
  protected readonly primaryButtonClass = primaryButtonClass;
  protected readonly secondaryButtonClass = secondaryButtonClass;
  protected readonly dangerButtonClass = dangerButtonClass;
  protected readonly textButtonClass = textButtonClass;

  protected readonly priceRappen = computed(() => {
    const value = Number(this.price().replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
  });
  protected readonly valid = computed(
    () =>
      this.name().trim().length > 0 &&
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(this.slug()) &&
      this.priceRappen() !== null,
  );

  constructor() {
    effect(() => {
      const product = this.product.value();
      if (!product) {
        return;
      }
      this.name.set(product.name);
      this.slug.set(product.slug);
      this.slugTouched.set(true);
      this.sku.set(product.sku ?? '');
      this.price.set((product.price_rappen / 100).toFixed(2));
      this.shortDescription.set(product.short_description ?? '');
      this.description.set(product.description ?? '');
      this.active.set(product.active);
      this.sortOrder.set(product.sort_order);
      this.trackStock.set(product.track_stock);
      this.stock.set(product.stock);
      this.options.set(
        product.product_options.map((option) => ({
          name: option.name,
          choices: option.choices.join(', '),
        })),
      );
    });
  }

  protected updateName(name: string): void {
    this.name.set(name);
    if (!this.slugTouched()) {
      this.slug.set(slugify(name));
    }
  }

  protected updateSlug(slug: string): void {
    this.slugTouched.set(true);
    this.slug.set(slugify(slug));
  }

  protected addOption(): void {
    this.options.update((options) => [...options, { name: '', choices: '' }]);
  }

  protected updateOption(index: number, field: keyof OptionDraft, value: string): void {
    this.options.update((options) =>
      options.map((option, position) =>
        position === index ? { ...option, [field]: value } : option,
      ),
    );
  }

  protected removeOption(index: number): void {
    this.options.update((options) => options.filter((_, position) => position !== index));
  }

  protected async save(): Promise<void> {
    if (!this.valid()) {
      this.message.set({
        tone: 'error',
        text: 'Bitte Name, URL-Kürzel und Preis korrekt ausfüllen.',
      });
      return;
    }
    this.saving.set(true);
    this.message.set(null);
    const draft: ProductDraft = {
      name: this.name(),
      slug: this.slug(),
      sku: this.sku(),
      price_rappen: this.priceRappen()!,
      short_description: this.shortDescription(),
      description: this.description(),
      active: this.active(),
      sort_order: Number(this.sortOrder()) || 0,
      track_stock: this.trackStock(),
      stock: this.trackStock() ? Math.max(Number(this.stock()) || 0, 0) : null,
      options: this.options().map((option) => ({
        name: option.name,
        choices: option.choices.split(','),
      })),
    };
    try {
      const id = await this.api.save(this.isNew() ? null : this.id(), draft);
      this.message.set({ tone: 'ok', text: 'Gespeichert.' });
      if (this.isNew()) {
        await this.router.navigate(['/admin/produkte', id]);
      } else {
        this.product.reload();
      }
    } catch (error) {
      this.message.set({ tone: 'error', text: (error as Error).message });
    } finally {
      this.saving.set(false);
    }
  }

  protected async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const product = this.product.value();
    if (!product || !input.files?.length) {
      return;
    }
    this.uploading.set(true);
    this.message.set(null);
    try {
      let sortOrder = product.product_images.length;
      for (const file of Array.from(input.files)) {
        await this.api.uploadImage(product.id, file, product.name, sortOrder++);
      }
      this.product.reload();
    } catch {
      this.message.set({ tone: 'error', text: 'Das Bild konnte nicht hochgeladen werden.' });
    } finally {
      input.value = '';
      this.uploading.set(false);
    }
  }

  protected async moveImage(index: number, delta: number): Promise<void> {
    const images = [...(this.product.value()?.product_images ?? [])];
    const target = index + delta;
    if (target < 0 || target >= images.length) {
      return;
    }
    [images[index], images[target]] = [images[target], images[index]];
    await Promise.all(
      images.map((image, position) => this.api.updateImage(image.id, { sort_order: position })),
    );
    this.product.reload();
  }

  protected async saveAlt(imageId: string, alt: string): Promise<void> {
    await this.api.updateImage(imageId, { alt: alt.trim() || null });
  }

  protected async removeImage(imageId: string, storagePath: string): Promise<void> {
    await this.api.removeImage(imageId, storagePath);
    this.product.reload();
  }

  protected async remove(): Promise<void> {
    const product = this.product.value();
    if (!product) {
      return;
    }
    await this.api.remove(product);
    await this.router.navigateByUrl('/admin/produkte');
  }
}

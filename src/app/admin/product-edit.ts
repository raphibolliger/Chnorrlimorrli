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
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductImage } from '../components/product-image';
import { francsInput, parseFrancs } from './francs';
import { AdminProduct, ProductAdminApi, ProductDraft, slugify } from './product-admin-api';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { danger, failure, Notice, NoticeBanner, success } from './ui/notice-banner';
import { AdminPageHeader } from './ui/page-header';
import { SectionCard } from './ui/section-card';

interface OptionForm {
  name: string;
  choices: string;
}

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  price: string;
  shortDescription: string;
  description: string;
  active: boolean;
  sortOrder: number;
  trackStock: boolean;
  stock: number | null;
  options: OptionForm[];
}

const newProduct: ProductForm = {
  name: '',
  slug: '',
  sku: '',
  price: '',
  shortDescription: '',
  description: '',
  active: false,
  sortOrder: 0,
  trackStock: false,
  stock: null,
  options: [],
};

function toForm(product: AdminProduct): ProductForm {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? '',
    price: francsInput(product.price_rappen),
    shortDescription: product.short_description ?? '',
    description: product.description ?? '',
    active: product.active,
    sortOrder: product.sort_order,
    trackStock: product.track_stock,
    stock: product.stock,
    options: product.product_options.map((option) => ({
      name: option.name,
      choices: option.choices.join(', '),
    })),
  };
}

function toDraft(form: ProductForm, priceRappen: number): ProductDraft {
  return {
    name: form.name,
    slug: form.slug,
    sku: form.sku,
    price_rappen: priceRappen,
    short_description: form.shortDescription,
    description: form.description,
    active: form.active,
    sort_order: Number(form.sortOrder) || 0,
    track_stock: form.trackStock,
    stock: form.trackStock ? Math.max(Number(form.stock) || 0, 0) : null,
    options: form.options.map((option) => ({
      name: option.name,
      choices: option.choices.split(','),
    })),
  };
}

@Component({
  selector: 'app-admin-product-edit',
  imports: [
    FormsModule,
    ProductImage,
    Icon,
    ListSkeleton,
    NoticeBanner,
    AdminPageHeader,
    SectionCard,
  ],
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

  private readonly savedProduct = computed(() => this.product.value(), {
    equal: (a, b) => a?.id === b?.id && a?.updated_at === b?.updated_at,
  });
  protected readonly form = linkedSignal(() => {
    const product = this.savedProduct();
    return product ? toForm(product) : newProduct;
  });
  private readonly slugTouched = linkedSignal(() => !!this.savedProduct());

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly confirmDelete = signal(false);

  protected readonly priceRappen = computed(() => parseFrancs(this.form().price));
  protected readonly valid = computed(
    () =>
      this.form().name.trim().length > 0 &&
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(this.form().slug) &&
      this.priceRappen() !== null,
  );

  protected patch<Field extends keyof ProductForm>(field: Field, value: ProductForm[Field]): void {
    this.form.update((form) => ({ ...form, [field]: value }));
  }

  protected updateName(name: string): void {
    this.patch('name', name);
    if (!this.slugTouched()) {
      this.patch('slug', slugify(name));
    }
  }

  protected updateSlug(slug: string): void {
    this.slugTouched.set(true);
    this.patch('slug', slugify(slug));
  }

  protected addOption(): void {
    this.patch('options', [...this.form().options, { name: '', choices: '' }]);
  }

  protected updateOption(index: number, field: keyof OptionForm, value: string): void {
    this.patch(
      'options',
      this.form().options.map((option, position) =>
        position === index ? { ...option, [field]: value } : option,
      ),
    );
  }

  protected removeOption(index: number): void {
    this.patch(
      'options',
      this.form().options.filter((_, position) => position !== index),
    );
  }

  protected async save(): Promise<void> {
    const priceRappen = this.priceRappen();
    if (!this.valid() || priceRappen === null) {
      this.notice.set(danger('Bitte Name, URL-Kürzel und Preis korrekt ausfüllen.'));
      return;
    }
    this.saving.set(true);
    this.notice.set(null);
    try {
      const id = await this.api.save(
        this.isNew() ? null : this.id(),
        toDraft(this.form(), priceRappen),
      );
      this.notice.set(success('Gespeichert.'));
      if (this.isNew()) {
        await this.router.navigate(['/admin/produkte', id]);
      } else {
        this.product.reload();
      }
    } catch (error) {
      this.notice.set(failure(error, 'Das Produkt konnte nicht gespeichert werden.'));
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
    const files = Array.from(input.files);
    this.uploading.set(true);
    await this.updateImages('Das Bild konnte nicht hochgeladen werden.', async () => {
      let sortOrder = product.product_images.length;
      for (const file of files) {
        await this.api.uploadImage(product.id, file, product.name, sortOrder++);
      }
    });
    input.value = '';
    this.uploading.set(false);
  }

  protected async moveImage(index: number, delta: number): Promise<void> {
    const images = [...(this.product.value()?.product_images ?? [])];
    const target = index + delta;
    if (target < 0 || target >= images.length) {
      return;
    }
    [images[index], images[target]] = [images[target], images[index]];
    await this.updateImages('Die Reihenfolge konnte nicht gespeichert werden.', () =>
      Promise.all(
        images.map((image, position) => this.api.updateImage(image.id, { sort_order: position })),
      ),
    );
  }

  protected async saveAlt(imageId: string, alt: string): Promise<void> {
    await this.updateImages('Die Bildbeschreibung konnte nicht gespeichert werden.', () =>
      this.api.updateImage(imageId, { alt: alt.trim() || null }),
    );
  }

  protected async removeImage(imageId: string, storagePath: string): Promise<void> {
    await this.updateImages('Das Bild konnte nicht gelöscht werden.', () =>
      this.api.removeImage(imageId, storagePath),
    );
  }

  protected async remove(): Promise<void> {
    const product = this.product.value();
    if (!product) {
      return;
    }
    try {
      await this.api.remove(product);
      await this.router.navigateByUrl('/admin/produkte');
    } catch (error) {
      this.notice.set(failure(error, 'Das Produkt konnte nicht gelöscht werden.'));
    }
  }

  private async updateImages(failureText: string, change: () => Promise<unknown>): Promise<void> {
    this.notice.set(null);
    try {
      await change();
    } catch (error) {
      this.notice.set(failure(error, failureText));
    }
    this.product.reload();
  }
}

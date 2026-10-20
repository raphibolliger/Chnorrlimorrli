import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { francsInput, parseFrancs } from './francs';
import { AdminProduct, ProductAdminApi, ProductDraft, slugify } from './product-admin-api';
import { AdminDialog } from './ui/dialog';
import { Icon } from './ui/icon';
import { danger, failure, Notice, NoticeBanner } from './ui/notice-banner';

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

function toForm(product: AdminProduct | null): ProductForm {
  if (!product) {
    return newProduct;
  }
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
  selector: 'app-product-form-dialog',
  imports: [FormsModule, AdminDialog, Icon, NoticeBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form-dialog.html',
})
export class ProductFormDialog {
  readonly product = input.required<AdminProduct | null>();
  readonly saved = output<string>();
  readonly dismissed = output();

  private readonly api = inject(ProductAdminApi);

  protected readonly form = linkedSignal(() => toForm(this.product()));
  private readonly initialForm = computed(() => JSON.stringify(toForm(this.product())));
  private readonly slugTouched = linkedSignal(() => this.product() !== null);

  protected readonly title = computed(() =>
    this.product() ? 'Produkt bearbeiten' : 'Neues Produkt',
  );
  protected readonly dirty = computed(() => JSON.stringify(this.form()) !== this.initialForm());
  protected readonly saving = signal(false);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly priceRappen = computed(() => parseFrancs(this.form().price));
  private readonly valid = computed(
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
      this.saved.emit(
        await this.api.save(this.product()?.id ?? null, toDraft(this.form(), priceRappen)),
      );
    } catch (error) {
      this.notice.set(failure(error, 'Das Produkt konnte nicht gespeichert werden.'));
    } finally {
      this.saving.set(false);
    }
  }
}

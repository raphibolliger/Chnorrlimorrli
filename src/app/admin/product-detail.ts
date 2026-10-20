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
import { ChfPipe } from '../core/chf.pipe';
import { AdminProductImage, ProductAdminApi } from './product-admin-api';
import { ProductFormDialog } from './product-form-dialog';
import { stockLabel, visibilityChip } from './product-labels';
import { AdminDialog } from './ui/dialog';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { failure, navigationNotice, Notice, NoticeBanner, success } from './ui/notice-banner';
import { AdminPageHeader } from './ui/page-header';
import { SectionCard } from './ui/section-card';
import { StatusChip } from './ui/status-chip';

@Component({
  selector: 'app-admin-product-detail',
  imports: [
    FormsModule,
    ProductImage,
    ChfPipe,
    ProductFormDialog,
    AdminDialog,
    Icon,
    ListSkeleton,
    NoticeBanner,
    AdminPageHeader,
    SectionCard,
    StatusChip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.html',
})
export class AdminProductDetail {
  readonly id = input.required<string>();

  private readonly api = inject(ProductAdminApi);
  private readonly router = inject(Router);

  protected readonly product = resource({
    params: () => this.id(),
    loader: ({ params }) => this.api.product(params),
  });
  protected readonly notice = signal<Notice | null>(navigationNotice(this.router));
  protected readonly editing = signal(false);
  protected readonly uploading = signal(false);
  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly describedImage = signal<AdminProductImage | null>(null);
  protected readonly imageDescription = linkedSignal(() => this.describedImage()?.alt ?? '');
  protected readonly removedImage = signal<AdminProductImage | null>(null);
  protected readonly imageBusy = signal(false);
  protected readonly imageNotice = signal<Notice | null>(null);
  protected readonly visibilityChip = visibilityChip;
  protected readonly stockLabel = stockLabel;

  protected readonly paragraphs = computed(() =>
    (this.product.value()?.description ?? '')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );
  protected readonly descriptionChanged = computed(
    () => this.imageDescription().trim() !== (this.describedImage()?.alt ?? ''),
  );

  protected saved(): void {
    this.editing.set(false);
    this.notice.set(success('Gespeichert.'));
    this.product.reload();
  }

  protected describeImage(image: AdminProductImage): void {
    this.imageNotice.set(null);
    this.describedImage.set(image);
  }

  protected async saveDescription(): Promise<void> {
    const image = this.describedImage();
    if (!image) {
      return;
    }
    await this.changeImages(
      'Die Bildbeschreibung konnte nicht gespeichert werden.',
      () => this.api.updateImage(image.id, { alt: this.imageDescription().trim() || null }),
      () => this.describedImage.set(null),
    );
  }

  protected removeImage(image: AdminProductImage): void {
    this.imageNotice.set(null);
    this.removedImage.set(image);
  }

  protected async confirmRemoveImage(): Promise<void> {
    const image = this.removedImage();
    if (!image) {
      return;
    }
    await this.changeImages(
      'Das Bild konnte nicht gelöscht werden.',
      () => this.api.removeImage(image.id, image.storage_path),
      () => this.removedImage.set(null),
    );
  }

  protected async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const product = this.product.value();
    if (!product || !input.files?.length) {
      return;
    }
    const files = Array.from(input.files);
    this.uploading.set(true);
    this.notice.set(null);
    try {
      let sortOrder = product.product_images.length;
      for (const file of files) {
        await this.api.uploadImage(product.id, file, product.name, sortOrder++);
      }
      this.notice.set(success(files.length === 1 ? 'Bild hochgeladen.' : 'Bilder hochgeladen.'));
    } catch (error) {
      this.notice.set(failure(error, 'Das Bild konnte nicht hochgeladen werden.'));
    }
    input.value = '';
    this.uploading.set(false);
    this.product.reload();
  }

  protected async moveImage(index: number, delta: number): Promise<void> {
    const images = [...(this.product.value()?.product_images ?? [])];
    const target = index + delta;
    if (target < 0 || target >= images.length) {
      return;
    }
    [images[index], images[target]] = [images[target], images[index]];
    this.notice.set(null);
    try {
      await Promise.all(
        images.map((image, position) => this.api.updateImage(image.id, { sort_order: position })),
      );
    } catch (error) {
      this.notice.set(failure(error, 'Die Reihenfolge konnte nicht gespeichert werden.'));
    }
    this.product.reload();
  }

  protected async remove(): Promise<void> {
    const product = this.product.value();
    if (!product) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.api.remove(product);
      await this.router.navigate(['/admin/produkte'], {
        state: { notice: `«${product.name}» wurde gelöscht.` },
      });
    } catch (error) {
      this.notice.set(failure(error, 'Das Produkt konnte nicht gelöscht werden.'));
      this.confirmingDelete.set(false);
    } finally {
      this.deleting.set(false);
    }
  }

  private async changeImages(
    failureText: string,
    change: () => Promise<unknown>,
    close: () => void,
  ): Promise<void> {
    this.imageBusy.set(true);
    this.imageNotice.set(null);
    try {
      await change();
      close();
      this.notice.set(success('Gespeichert.'));
      this.product.reload();
    } catch (error) {
      this.imageNotice.set(failure(error, failureText));
    } finally {
      this.imageBusy.set(false);
    }
  }
}

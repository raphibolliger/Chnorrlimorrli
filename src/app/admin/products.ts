import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductImage } from '../components/product-image';
import { ChfPipe } from '../core/chf.pipe';
import { AdminProduct, ProductAdminApi } from './product-admin-api';
import { ProductFormDialog } from './product-form-dialog';
import { stockLabel, visibilityChip } from './product-labels';
import { EmptyState } from './ui/empty-state';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { failure, navigationNotice, Notice, NoticeBanner } from './ui/notice-banner';
import { AdminPageHeader } from './ui/page-header';
import { StatusChip } from './ui/status-chip';

@Component({
  selector: 'app-admin-products',
  imports: [
    RouterLink,
    ProductImage,
    ProductFormDialog,
    ChfPipe,
    EmptyState,
    Icon,
    ListSkeleton,
    NoticeBanner,
    AdminPageHeader,
    StatusChip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.html',
})
export class AdminProducts {
  private readonly api = inject(ProductAdminApi);
  private readonly router = inject(Router);

  protected readonly products = resource({ loader: () => this.api.products() });
  protected readonly notice = signal<Notice | null>(navigationNotice(this.router));
  protected readonly creating = signal(false);

  protected readonly visibilityChip = visibilityChip;
  protected readonly stockLabel = stockLabel;

  protected created(id: string): void {
    this.router.navigate(['/admin/produkte', id], {
      state: { notice: 'Produkt erstellt. Jetzt kannst du Bilder hochladen.' },
    });
  }

  protected open(product: AdminProduct): void {
    this.router.navigate(['/admin/produkte', product.id]);
  }

  protected async toggleActive(product: AdminProduct, event: Event): Promise<void> {
    event.stopPropagation();
    this.notice.set(null);
    try {
      await this.api.setActive(product.id, !product.active);
    } catch (error) {
      this.notice.set(failure(error, 'Die Sichtbarkeit konnte nicht geändert werden.'));
    }
    this.products.reload();
  }
}

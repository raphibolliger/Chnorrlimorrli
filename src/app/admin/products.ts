import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductImage } from '../components/product-image';
import { ChfPipe } from '../core/chf.pipe';
import { AdminProduct, ProductAdminApi } from './product-admin-api';
import { primaryButtonClass } from './ui/classes';
import { EmptyState } from './ui/empty-state';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { AdminPageHeader } from './ui/page-header';
import { StatusChip } from './ui/status-chip';
import { Chip } from './ui/tones';

const activeChip: Chip = { label: 'Sichtbar', icon: 'check', tone: 'success' };
const inactiveChip: Chip = { label: 'Ausgeblendet', icon: 'close', tone: 'neutral' };

@Component({
  selector: 'app-admin-products',
  imports: [
    RouterLink,
    ProductImage,
    ChfPipe,
    EmptyState,
    Icon,
    ListSkeleton,
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
  protected readonly primaryButtonClass = primaryButtonClass;

  protected visibilityChip(product: AdminProduct): Chip {
    return product.active ? activeChip : inactiveChip;
  }

  protected stockLabel(product: AdminProduct): string {
    return product.track_stock ? `${product.stock ?? 0} Stk.` : 'unbegrenzt';
  }

  protected open(product: AdminProduct): void {
    this.router.navigate(['/admin/produkte', product.id]);
  }

  protected async toggleActive(product: AdminProduct, event: Event): Promise<void> {
    event.stopPropagation();
    await this.api.setActive(product.id, !product.active);
    this.products.reload();
  }
}

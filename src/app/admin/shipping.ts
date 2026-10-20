import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { ShippingPricePipe } from '../core/shipping-price.pipe';
import { ShippingMethod } from '../core/shop-api';
import { ChfPipe } from '../core/chf.pipe';
import { ShippingAdminApi } from './shipping-admin-api';
import { shippingKinds } from './shipping-labels';
import { ShippingMethodDialog } from './shipping-method-dialog';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { Notice, NoticeBanner, success } from './ui/notice-banner';
import { AdminPageHeader } from './ui/page-header';
import { SectionCard } from './ui/section-card';
import { StatusChip } from './ui/status-chip';
import { Chip } from './ui/tones';

const offeredChip: Chip = { label: 'An der Kasse', icon: 'check', tone: 'success' };
const hiddenChip: Chip = { label: 'Ausgeblendet', icon: 'close', tone: 'neutral' };

@Component({
  selector: 'app-admin-shipping',
  imports: [
    ChfPipe,
    ShippingPricePipe,
    ShippingMethodDialog,
    Icon,
    ListSkeleton,
    NoticeBanner,
    AdminPageHeader,
    SectionCard,
    StatusChip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping.html',
})
export class AdminShipping {
  private readonly api = inject(ShippingAdminApi);

  protected readonly methods = resource({ loader: () => this.api.methods() });
  protected readonly editing = signal<ShippingMethod | null>(null);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly kinds = shippingKinds;

  protected availabilityChip(method: ShippingMethod): Chip {
    return method.active ? offeredChip : hiddenChip;
  }

  protected edit(method: ShippingMethod): void {
    this.notice.set(null);
    this.editing.set(method);
  }

  protected saved(): void {
    this.editing.set(null);
    this.notice.set(success('Gespeichert.'));
    this.methods.reload();
  }
}

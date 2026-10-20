import { DatePipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import {
  fulfillmentFlow,
  fulfillmentStepLabel,
  OrderAction,
  orderPagePath,
  paymentMethodLabel,
} from '../../../supabase/functions/_shared/orders';
import { ChfPipe } from '../core/chf.pipe';
import { ShippingPricePipe } from '../core/shipping-price.pipe';
import { AdminApi } from './admin-api';
import { OrderActionDialog } from './order-action-dialog';
import { fulfillmentChips, paymentChips } from './order-chips';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { Notice, NoticeBanner, success } from './ui/notice-banner';
import { AdminPageHeader } from './ui/page-header';
import { SectionCard } from './ui/section-card';
import { StatusChip } from './ui/status-chip';

const eventLabels: Record<string, string> = {
  created: 'Bestellung angelegt',
  paid: 'Bezahlt',
  failed: 'Zahlung fehlgeschlagen',
  expired: 'Zahlung abgebrochen',
  refunded: 'Erstattet',
  cancelled: 'Storniert',
  status_processing: 'In Arbeit',
  status_ready_for_pickup: 'Abholbereit',
  status_shipped: 'Versandt',
  status_delivered: 'Geliefert',
  mail_sent: 'Mail gesendet',
  mail_failed: 'Mail fehlgeschlagen',
  checkout_failed: 'Zahlung konnte nicht gestartet werden',
};

@Component({
  selector: 'app-admin-order-detail',
  imports: [
    DatePipe,
    KeyValuePipe,
    ChfPipe,
    ShippingPricePipe,
    OrderActionDialog,
    Icon,
    ListSkeleton,
    NoticeBanner,
    AdminPageHeader,
    SectionCard,
    StatusChip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-detail.html',
})
export class AdminOrderDetail {
  readonly id = input.required<string>();

  private readonly api = inject(AdminApi);

  protected readonly order = resource({
    params: () => this.id(),
    loader: ({ params }) => this.api.order(params),
  });
  protected readonly notice = signal<Notice | null>(null);
  protected readonly pendingAction = signal<OrderAction | null>(null);
  protected readonly paymentMethodLabel = paymentMethodLabel;
  protected readonly paymentChips = paymentChips;
  protected readonly fulfillmentChips = fulfillmentChips;

  protected readonly actions = computed(() => {
    const order = this.order.value();
    if (!order || order.payment_status !== 'paid' || order.fulfillment_status === 'cancelled') {
      return [];
    }
    return fulfillmentFlow[order.shipping_kind]
      .filter((action) => action !== order.fulfillment_status)
      .map((action) => ({ action, label: fulfillmentStepLabel(action, order.shipping_kind) }));
  });

  protected readonly orderPageUrl = computed(() => {
    const order = this.order.value();
    return order ? orderPagePath(order.access_token) : null;
  });

  protected readonly canCancel = computed(() => {
    const order = this.order.value();
    return !!order && order.fulfillment_status !== 'cancelled';
  });

  protected eventLabel(kind: string): string {
    return eventLabels[kind] ?? kind;
  }

  protected startAction(action: OrderAction): void {
    this.notice.set(null);
    this.pendingAction.set(action);
  }

  protected completed(message: string): void {
    this.pendingAction.set(null);
    this.notice.set(success(message));
    this.order.reload();
  }
}

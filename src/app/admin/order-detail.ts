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
import { FormsModule } from '@angular/forms';
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
import { fulfillmentChips, paymentChips } from './order-chips';
import { Icon } from './ui/icon';
import { ListSkeleton } from './ui/list-skeleton';
import { failure, Notice, NoticeBanner, success } from './ui/notice-banner';
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
    FormsModule,
    ChfPipe,
    ShippingPricePipe,
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
  protected readonly trackingNumber = signal('');
  protected readonly notifyCustomer = signal(true);
  protected readonly busy = signal(false);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly confirmCancel = signal(false);
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

  protected readonly awaitsShipping = computed(() => {
    const order = this.order.value();
    return (
      order?.shipping_kind === 'postal' &&
      order.payment_status === 'paid' &&
      (order.fulfillment_status === 'new' || order.fulfillment_status === 'processing')
    );
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

  protected async run(action: OrderAction): Promise<void> {
    const order = this.order.value();
    if (!order) {
      return;
    }
    this.busy.set(true);
    this.notice.set(null);
    try {
      const result = await this.api.updateOrder({
        orderId: order.id,
        action,
        trackingNumber: action === 'shipped' ? this.trackingNumber() : '',
        sendMail: this.notifyCustomer(),
      });
      const parts = ['Gespeichert.'];
      if (result.refunded) parts.push('Betrag über Stripe erstattet.');
      if (result.mailed) parts.push('Mail an die Kundin oder den Kunden gesendet.');
      this.notice.set(success(parts.join(' ')));
      this.confirmCancel.set(false);
      this.order.reload();
    } catch (error) {
      this.notice.set(failure(error, 'Die Bestellung konnte nicht aktualisiert werden.'));
    } finally {
      this.busy.set(false);
    }
  }
}

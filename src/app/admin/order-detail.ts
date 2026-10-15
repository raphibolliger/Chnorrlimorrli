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
import { ChfPipe } from '../core/chf.pipe';
import { AdminApi, OrderAction, paymentMethodLabel } from './admin-api';
import { fulfillmentChip, paymentChip } from './order-chips';
import {
  checkboxClass,
  dangerButtonClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './ui/classes';
import { ListSkeleton } from './ui/list-skeleton';
import { AdminPageHeader } from './ui/page-header';
import { SectionCard } from './ui/section-card';
import { StatusChip } from './ui/status-chip';

interface ActionButton {
  action: OrderAction;
  label: string;
  mail: boolean;
}

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
    ListSkeleton,
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
  protected readonly feedback = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);
  protected readonly confirmCancel = signal(false);
  protected readonly paymentMethodLabel = paymentMethodLabel;
  protected readonly paymentChip = paymentChip;
  protected readonly fulfillmentChip = fulfillmentChip;
  protected readonly fieldClass = fieldClass;
  protected readonly labelClass = labelClass;
  protected readonly checkboxClass = checkboxClass;
  protected readonly primaryButtonClass = primaryButtonClass;
  protected readonly secondaryButtonClass = secondaryButtonClass;
  protected readonly dangerButtonClass = dangerButtonClass;

  protected readonly actions = computed<ActionButton[]>(() => {
    const order = this.order.value();
    if (!order || order.payment_status !== 'paid' || order.fulfillment_status === 'cancelled') {
      return [];
    }
    const steps: ActionButton[] = [{ action: 'processing', label: 'In Arbeit', mail: false }];
    if (order.shipping_kind === 'pickup') {
      steps.push({ action: 'ready_for_pickup', label: 'Abholbereit', mail: true });
      steps.push({ action: 'delivered', label: 'Abgeholt', mail: true });
    } else if (order.shipping_kind === 'postal') {
      steps.push({ action: 'shipped', label: 'Versandt', mail: true });
      steps.push({ action: 'delivered', label: 'Geliefert', mail: true });
    } else {
      steps.push({ action: 'delivered', label: 'Geliefert', mail: true });
    }
    return steps.filter((step) => step.action !== order.fulfillment_status);
  });

  protected readonly awaitsShipping = computed(() => {
    const order = this.order.value();
    return (
      order?.shipping_kind === 'postal' &&
      order.payment_status === 'paid' &&
      (order.fulfillment_status === 'new' || order.fulfillment_status === 'processing')
    );
  });

  protected readonly canCancel = computed(() => {
    const order = this.order.value();
    return (
      !!order && order.fulfillment_status !== 'cancelled' && order.payment_status !== 'refunded'
    );
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
    this.feedback.set(null);
    try {
      const result = await this.api.updateOrder(order.id, action, {
        trackingNumber: action === 'shipped' ? this.trackingNumber() : undefined,
        sendMail: this.notifyCustomer(),
      });
      const parts = ['Gespeichert.'];
      if (result.refunded) parts.push('Betrag über Stripe erstattet.');
      if (result.mailed) parts.push('Mail an die Kundin oder den Kunden gesendet.');
      this.feedback.set({ tone: 'ok', text: parts.join(' ') });
      this.confirmCancel.set(false);
      this.order.reload();
    } catch (error) {
      this.feedback.set({ tone: 'error', text: (error as Error).message });
    } finally {
      this.busy.set(false);
    }
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  FulfillmentStatus,
  fulfillmentStatusLabels,
  PaymentStatus,
  paymentStatusLabels,
} from './admin-api';

const tones: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  expired: 'bg-ink/10 text-ink/70',
  refunded: 'bg-purple-100 text-purple-800',
  new: 'bg-mais-100 text-navy',
  processing: 'bg-blue-100 text-blue-800',
  ready_for_pickup: 'bg-teal-100 text-teal-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-ink/10 text-ink/70',
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly payment = input<PaymentStatus>();
  readonly fulfillment = input<FulfillmentStatus>();

  protected readonly label = computed(() => {
    const payment = this.payment();
    const fulfillment = this.fulfillment();
    return payment
      ? paymentStatusLabels[payment]
      : fulfillment
        ? fulfillmentStatusLabels[fulfillment]
        : '';
  });
  protected readonly tone = computed(() => tones[this.payment() ?? this.fulfillment() ?? ''] ?? '');
}

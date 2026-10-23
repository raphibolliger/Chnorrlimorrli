import { DatePipe, KeyValuePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  OrderSummary,
  paymentMethodLabel,
  pickupPlace,
  trackingUrl,
} from '../../../supabase/functions/_shared/orders';
import { contactEmail } from '../content/navigation';
import { Cart } from '../core/cart';
import { CheckoutApi } from '../core/checkout-api';
import { ChfPipe } from '../core/chf.pipe';
import { orderProgress, statusHeadline } from '../core/order-progress';
import { ShippingPricePipe } from '../core/shipping-price.pipe';

const maxPaymentChecks = 15;

@Component({
  selector: 'app-order-status',
  imports: [DatePipe, KeyValuePipe, RouterLink, ChfPipe, ShippingPricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-status.html',
})
export class OrderStatus {
  readonly code = input<string>();
  readonly neu = input<string>();

  private readonly checkoutApi = inject(CheckoutApi);
  private readonly cart = inject(Cart);

  protected readonly contactEmail = contactEmail;
  protected readonly order = signal<OrderSummary | null>(null);
  protected readonly state = signal<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  protected readonly justOrdered = computed(() => this.neu() !== undefined);
  protected readonly progress = computed(() => {
    const order = this.order();
    return order ? orderProgress(order) : [];
  });
  protected readonly headline = computed(() => {
    const order = this.order();
    return order ? statusHeadline(order) : '';
  });
  protected readonly awaitsOnlinePayment = computed(() => {
    const order = this.order();
    return order?.fulfillment_status !== 'cancelled' && order?.payment_status === 'pending';
  });
  protected readonly missedOnlinePayment = computed(() => {
    const order = this.order();
    return (
      order?.fulfillment_status !== 'cancelled' &&
      (order?.payment_status === 'failed' || order?.payment_status === 'expired')
    );
  });
  protected readonly paidWith = computed(() => {
    const order = this.order();
    return order?.payment_status === 'paid' || order?.payment_status === 'refunded'
      ? paymentMethodLabel(order.payment_method)
      : null;
  });
  protected readonly pickupPlace = computed(() => {
    const method = this.order()?.shipping_methods;
    return pickupPlace(method?.pickup_location ?? null, method?.pickup_hours ?? null);
  });
  protected readonly trackingUrl = computed(() => {
    const trackingNumber = this.order()?.tracking_number;
    return trackingNumber ? trackingUrl(trackingNumber) : null;
  });

  private paymentChecks = 0;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    afterNextRender(() => this.load());
  }

  private async load(): Promise<void> {
    const code = this.code();
    if (!code) {
      this.state.set('not-found');
      return;
    }
    try {
      const order = await this.checkoutApi.orderSummary(code);
      if (!order) {
        this.state.set('not-found');
        return;
      }
      this.order.set(order);
      this.state.set('ready');
      if (order.confirmed_at !== null && this.justOrdered()) {
        this.cart.clear();
      } else if (order.payment_status === 'pending' && this.paymentChecks++ < maxPaymentChecks) {
        this.timer = setTimeout(() => this.load(), 2000);
      }
    } catch {
      this.state.set('error');
    }
  }
}

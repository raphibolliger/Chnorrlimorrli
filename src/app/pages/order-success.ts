import { KeyValuePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart } from '../core/cart';
import { CheckoutApi, OrderSummary } from '../core/checkout-api';
import { ChfPipe } from '../core/chf.pipe';

@Component({
  selector: 'app-order-success',
  imports: [KeyValuePipe, RouterLink, ChfPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-success.html',
})
export class OrderSuccess {
  readonly sessionId = input<string>(undefined, { alias: 'session_id' });

  private readonly checkoutApi = inject(CheckoutApi);
  private readonly cart = inject(Cart);

  protected readonly order = signal<OrderSummary | null>(null);
  protected readonly state = signal<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  private attempts = 0;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    afterNextRender(() => this.load());
  }

  private async load(): Promise<void> {
    const sessionId = this.sessionId();
    if (!sessionId) {
      this.state.set('not-found');
      return;
    }
    try {
      const order = await this.checkoutApi.orderSummary(sessionId);
      if (!order) {
        this.state.set('not-found');
        return;
      }
      this.order.set(order);
      this.state.set('ready');
      if (order.payment_status === 'paid') {
        this.cart.clear();
      } else if (order.payment_status === 'pending' && this.attempts++ < 15) {
        this.timer = setTimeout(() => this.load(), 2000);
      }
    } catch {
      this.state.set('error');
    }
  }
}

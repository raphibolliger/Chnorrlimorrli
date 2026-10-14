import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OpenPoint } from '../components/open-point';
import { PageIntro } from '../components/page-intro';
import { ChfPipe } from '../core/chf.pipe';
import { ShippingMethod, ShopApi } from '../core/shop-api';

@Component({
  selector: 'app-shipping-payment',
  imports: [RouterLink, OpenPoint, PageIntro, ChfPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping-payment.html',
})
export class ShippingPayment {
  private readonly shopApi = inject(ShopApi);

  protected readonly methods = signal<ShippingMethod[] | null>(null);
  protected readonly loadFailed = signal(false);

  constructor() {
    afterNextRender(() => {
      this.shopApi
        .shippingMethods()
        .then((methods) => this.methods.set(methods))
        .catch(() => this.loadFailed.set(true));
    });
  }
}

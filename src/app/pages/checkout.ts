import { DOCUMENT, KeyValuePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  deliversTo,
  isSwissPostalCode,
  shippingPriceRappen,
} from '../../../supabase/functions/_shared/pricing';
import type { CheckoutPayment } from '../../../supabase/functions/_shared/orders';
import { Cart } from '../core/cart';
import { CheckoutApi, CheckoutError, checkoutFailed } from '../core/checkout-api';
import { ChfPipe } from '../core/chf.pipe';
import { ShippingPricePipe } from '../core/shipping-price.pipe';
import { ShippingMethod, ShopApi } from '../core/shop-api';

type AddressField = 'street' | 'postalCode' | 'city';

interface PaymentOption {
  value: CheckoutPayment;
  label: string;
  description: string;
}

@Component({
  selector: 'app-checkout',
  imports: [KeyValuePipe, ReactiveFormsModule, RouterLink, ChfPipe, ShippingPricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.html',
})
export class Checkout {
  readonly abgebrochen = input<string>();

  protected readonly cart = inject(Cart);
  private readonly shopApi = inject(ShopApi);
  private readonly checkoutApi = inject(CheckoutApi);
  private readonly document = inject(DOCUMENT);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    shippingMethodId: ['', Validators.required],
    street: [''],
    postalCode: [''],
    city: [''],
    note: [''],
    payment: ['online' as CheckoutPayment],
    termsAccepted: [false, Validators.requiredTrue],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly methods = signal<ShippingMethod[]>([]);
  protected readonly loadFailed = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly submitted = signal(false);

  protected readonly selectedMethod = computed(() =>
    this.methods().find((method) => method.id === this.formValue().shippingMethodId),
  );
  protected readonly needsAddress = computed(
    () => this.selectedMethod() !== undefined && this.selectedMethod()?.kind !== 'pickup',
  );
  protected readonly offersCashPayment = computed(() => this.selectedMethod()?.kind === 'pickup');
  protected readonly paysCash = computed(
    () => this.offersCashPayment() && this.formValue().payment === 'cash',
  );
  protected readonly paymentOptions: PaymentOption[] = [
    {
      value: 'online',
      label: 'Online bezahlen',
      description: 'Mit TWINT, Karte, Apple Pay oder Google Pay über Stripe.',
    },
    {
      value: 'cash',
      label: 'Barzahlung bei Abholung',
      description: 'Du bezahlst bei der Abholung in Villmergen, bar oder direkt vor Ort.',
    },
  ];
  protected readonly shippingRappen = computed(() => {
    const method = this.selectedMethod();
    return method ? shippingPriceRappen(method.shipping_rates, this.cart.subtotalRappen()) : 0;
  });
  protected readonly totalRappen = computed(
    () => this.cart.subtotalRappen() + this.shippingRappen(),
  );
  protected readonly addressErrors = computed<Record<AddressField, boolean>>(() => {
    const { street = '', postalCode = '', city = '' } = this.formValue();
    const needsAddress = this.needsAddress();
    return {
      street: needsAddress && !street.trim(),
      postalCode: needsAddress && !isSwissPostalCode(postalCode),
      city: needsAddress && !city.trim(),
    };
  });
  protected readonly localDeliveryBlocked = computed(() => {
    const method = this.selectedMethod();
    const postalCode = this.formValue().postalCode ?? '';
    return (
      method?.kind === 'local_delivery' &&
      isSwissPostalCode(postalCode) &&
      !deliversTo(method.postal_codes, postalCode)
    );
  });

  constructor() {
    afterNextRender(() => this.loadMethods());
  }

  protected shippingPriceOf(method: ShippingMethod): number {
    return shippingPriceRappen(method.shipping_rates, this.cart.subtotalRappen());
  }

  protected showError(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || this.submitted());
  }

  protected addressMissing(field: AddressField): boolean {
    return this.addressErrors()[field] && (this.form.controls[field].touched || this.submitted());
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.errors.set([]);
    const addressIncomplete = Object.values(this.addressErrors()).some(Boolean);
    if (this.form.invalid || addressIncomplete || this.localDeliveryBlocked()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    try {
      const url = await this.checkoutApi.startCheckout({
        items: this.cart.items().map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          options: item.options,
        })),
        shippingMethodId: value.shippingMethodId,
        customer: {
          email: value.email,
          firstName: value.firstName,
          lastName: value.lastName,
          phone: value.phone,
          street: value.street,
          postalCode: value.postalCode,
          city: value.city,
        },
        note: value.note,
        termsAccepted: value.termsAccepted,
        payment: this.paysCash() ? 'cash' : 'online',
        returnBaseUrl: new URL('.', this.document.baseURI).href,
      });
      this.document.location.assign(url);
    } catch (error) {
      this.errors.set(error instanceof CheckoutError ? error.messages : [checkoutFailed]);
      this.submitting.set(false);
    }
  }

  private async loadMethods(): Promise<void> {
    try {
      const methods = await this.shopApi.shippingMethods();
      this.methods.set(methods);
      if (!this.form.controls.shippingMethodId.value && methods[0]) {
        this.form.controls.shippingMethodId.setValue(methods[0].id);
      }
    } catch {
      this.loadFailed.set(true);
    }
  }
}

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
import { Cart } from '../core/cart';
import { CheckoutApi, CheckoutError } from '../core/checkout-api';
import { ChfPipe } from '../core/chf.pipe';
import { ShippingMethod, ShopApi } from '../core/shop-api';

@Component({
  selector: 'app-checkout',
  imports: [KeyValuePipe, ReactiveFormsModule, RouterLink, ChfPipe],
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
  protected readonly shippingRappen = computed(() => {
    const method = this.selectedMethod();
    return method ? shippingPriceRappen(method.shipping_rates, this.cart.subtotalRappen()) : 0;
  });
  protected readonly totalRappen = computed(
    () => this.cart.subtotalRappen() + this.shippingRappen(),
  );
  protected readonly postalCodeValid = computed(() =>
    isSwissPostalCode(this.formValue().postalCode ?? ''),
  );
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

  protected addressMissing(field: 'street' | 'postalCode' | 'city'): boolean {
    if (!this.needsAddress()) {
      return false;
    }
    const control = this.form.controls[field];
    const touched = control.touched || this.submitted();
    if (field === 'postalCode') {
      return touched && !this.postalCodeValid();
    }
    return touched && !control.value.trim();
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.errors.set([]);
    const addressIncomplete =
      this.needsAddress() &&
      (!this.form.controls.street.value.trim() ||
        !this.postalCodeValid() ||
        !this.form.controls.city.value.trim());
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
        returnBaseUrl: new URL('.', this.document.baseURI).href,
      });
      this.document.location.assign(url);
    } catch (error) {
      this.errors.set(
        error instanceof CheckoutError
          ? error.messages
          : ['Die Zahlung konnte nicht gestartet werden. Bitte versuche es später noch einmal.'],
      );
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

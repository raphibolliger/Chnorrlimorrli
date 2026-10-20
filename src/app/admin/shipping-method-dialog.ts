import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShippingMethod } from '../core/shop-api';
import { francsInput, parseFrancs } from './francs';
import { parsePostalCodes, ShippingAdminApi } from './shipping-admin-api';
import { shippingKinds } from './shipping-labels';
import { AdminDialog } from './ui/dialog';
import { Icon } from './ui/icon';
import { danger, failure, Notice, NoticeBanner } from './ui/notice-banner';

interface RateForm {
  from: string;
  price: string;
}

interface ShippingForm {
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
  postalCodes: string;
  pickupLocation: string;
  pickupHours: string;
  rates: RateForm[];
}

function toForm(method: ShippingMethod): ShippingForm {
  return {
    name: method.name,
    description: method.description ?? '',
    active: method.active,
    sortOrder: method.sort_order,
    postalCodes: method.postal_codes.join(', '),
    pickupLocation: method.pickup_location ?? '',
    pickupHours: method.pickup_hours ?? '',
    rates: method.shipping_rates.map((rate) => ({
      from: francsInput(rate.from_subtotal_rappen),
      price: francsInput(rate.price_rappen),
    })),
  };
}

@Component({
  selector: 'app-shipping-method-dialog',
  imports: [FormsModule, AdminDialog, Icon, NoticeBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping-method-dialog.html',
})
export class ShippingMethodDialog {
  readonly method = input.required<ShippingMethod>();
  readonly saved = output();
  readonly dismissed = output();

  private readonly api = inject(ShippingAdminApi);

  protected readonly kind = computed(() => shippingKinds[this.method().kind]);
  protected readonly form = linkedSignal(() => toForm(this.method()));
  private readonly initialForm = computed(() => JSON.stringify(toForm(this.method())));
  protected readonly dirty = computed(() => JSON.stringify(this.form()) !== this.initialForm());
  protected readonly saving = signal(false);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly parsedPostalCodes = computed(() => parsePostalCodes(this.form().postalCodes));

  protected patch<Field extends keyof ShippingForm>(
    field: Field,
    value: ShippingForm[Field],
  ): void {
    this.form.update((form) => ({ ...form, [field]: value }));
  }

  protected updateRate(index: number, field: keyof RateForm, value: string): void {
    this.patch(
      'rates',
      this.form().rates.map((rate, position) =>
        position === index ? { ...rate, [field]: value } : rate,
      ),
    );
  }

  protected addRate(): void {
    this.patch('rates', [...this.form().rates, { from: '', price: '' }]);
  }

  protected removeRate(index: number): void {
    this.patch(
      'rates',
      this.form().rates.filter((_, position) => position !== index),
    );
  }

  protected async save(): Promise<void> {
    const form = this.form();
    const rates = form.rates.flatMap((rate) => {
      const from_subtotal_rappen = parseFrancs(rate.from);
      const price_rappen = parseFrancs(rate.price);
      return from_subtotal_rappen === null || price_rappen === null
        ? []
        : [{ from_subtotal_rappen, price_rappen }];
    });
    const ratesValid =
      rates.length > 0 &&
      rates.length === form.rates.length &&
      rates.some((rate) => rate.from_subtotal_rappen === 0);
    if (!form.name.trim() || !ratesValid) {
      this.notice.set(
        danger(
          'Bitte einen Namen angeben und gültige Preisstufen erfassen (eine davon ab CHF 0.00).',
        ),
      );
      return;
    }
    this.saving.set(true);
    this.notice.set(null);
    try {
      await this.api.save(this.method().id, {
        name: form.name,
        description: form.description,
        active: form.active,
        sort_order: Number(form.sortOrder) || 0,
        postal_codes: this.method().kind === 'local_delivery' ? this.parsedPostalCodes() : [],
        pickup_location: form.pickupLocation,
        pickup_hours: form.pickupHours,
        rates,
      });
      this.saved.emit();
    } catch (error) {
      this.notice.set(failure(error, 'Die Versandmethode konnte nicht gespeichert werden.'));
    } finally {
      this.saving.set(false);
    }
  }
}

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
import { AdminShippingMethod, parsePostalCodes, ShippingAdminApi } from './shipping-admin-api';
import {
  checkboxClass,
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
  textareaClass,
  textButtonClass,
} from './ui/classes';
import { Icon } from './ui/icon';
import { SectionCard } from './ui/section-card';
import { IconName } from './ui/tones';

interface RateDraft {
  from: string;
  price: string;
}

const kindLabels = {
  pickup: 'Abholung',
  postal: 'Postversand',
  local_delivery: 'Lokale Lieferung',
} as const;

const kindIcons: Record<AdminShippingMethod['kind'], IconName> = {
  pickup: 'store',
  postal: 'mail',
  local_delivery: 'shipping',
};

function francs(rappen: number): string {
  return (rappen / 100).toFixed(2);
}

function rappen(value: string): number | null {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

@Component({
  selector: 'app-shipping-method-form',
  imports: [FormsModule, Icon, SectionCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping-method-form.html',
})
export class ShippingMethodForm {
  readonly method = input.required<AdminShippingMethod>();
  readonly saved = output();

  private readonly api = inject(ShippingAdminApi);

  protected readonly kindLabel = computed(() => kindLabels[this.method().kind]);
  protected readonly kindIcon = computed(() => kindIcons[this.method().kind]);
  protected readonly fieldClass = fieldClass;
  protected readonly textareaClass = textareaClass;
  protected readonly labelClass = labelClass;
  protected readonly hintClass = hintClass;
  protected readonly checkboxClass = checkboxClass;
  protected readonly primaryButtonClass = primaryButtonClass;
  protected readonly textButtonClass = textButtonClass;
  protected readonly name = linkedSignal(() => this.method().name);
  protected readonly description = linkedSignal(() => this.method().description ?? '');
  protected readonly active = linkedSignal(() => this.method().active);
  protected readonly sortOrder = linkedSignal(() => this.method().sort_order);
  protected readonly postalCodes = linkedSignal(() => this.method().postal_codes.join(', '));
  protected readonly pickupLocation = linkedSignal(() => this.method().pickup_location ?? '');
  protected readonly pickupHours = linkedSignal(() => this.method().pickup_hours ?? '');
  protected readonly rates = linkedSignal<RateDraft[]>(() =>
    this.method().shipping_rates.map((rate) => ({
      from: francs(rate.from_subtotal_rappen),
      price: francs(rate.price_rappen),
    })),
  );

  protected readonly saving = signal(false);
  protected readonly message = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);
  protected readonly parsedPostalCodes = computed(() => parsePostalCodes(this.postalCodes()));
  protected readonly ratesValid = computed(
    () =>
      this.rates().length > 0 &&
      this.rates().every((rate) => rappen(rate.from) !== null && rappen(rate.price) !== null) &&
      this.rates().some((rate) => rappen(rate.from) === 0),
  );

  protected updateRate(index: number, field: keyof RateDraft, value: string): void {
    this.rates.update((rates) =>
      rates.map((rate, position) => (position === index ? { ...rate, [field]: value } : rate)),
    );
  }

  protected addRate(): void {
    this.rates.update((rates) => [...rates, { from: '', price: '' }]);
  }

  protected removeRate(index: number): void {
    this.rates.update((rates) => rates.filter((_, position) => position !== index));
  }

  protected async save(): Promise<void> {
    if (!this.name().trim() || !this.ratesValid()) {
      this.message.set({
        tone: 'error',
        text: 'Bitte einen Namen angeben und gültige Preisstufen erfassen (eine davon ab CHF 0.00).',
      });
      return;
    }
    this.saving.set(true);
    this.message.set(null);
    try {
      await this.api.save(this.method().id, {
        name: this.name(),
        description: this.description(),
        active: this.active(),
        sort_order: Number(this.sortOrder()) || 0,
        postal_codes: this.method().kind === 'local_delivery' ? this.parsedPostalCodes() : [],
        pickup_location: this.pickupLocation(),
        pickup_hours: this.pickupHours(),
        rates: this.rates().map((rate) => ({
          from_subtotal_rappen: rappen(rate.from)!,
          price_rappen: rappen(rate.price)!,
        })),
      });
      this.message.set({ tone: 'ok', text: 'Gespeichert.' });
      this.saved.emit();
    } catch {
      this.message.set({
        tone: 'error',
        text: 'Die Versandmethode konnte nicht gespeichert werden.',
      });
    } finally {
      this.saving.set(false);
    }
  }
}

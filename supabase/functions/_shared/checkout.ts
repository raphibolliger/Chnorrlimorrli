import type { CheckoutRequest, ProductOptions, ShippingKind, TableRow } from './orders.ts';
import {
  deliversTo,
  isSwissPostalCode,
  maxLineQuantity,
  normalizePostalCode,
  shippingPriceRappen,
} from './pricing.ts';

export const catalogProductColumns =
  'id, name, sku, price_rappen, active, track_stock, stock, product_options(name, choices), product_images(storage_path, sort_order)';

export const catalogShippingMethodColumns =
  'id, kind, name, active, postal_codes, shipping_rates(from_subtotal_rappen, price_rappen)';

export type CatalogProduct = Pick<
  TableRow<'products'>,
  'id' | 'name' | 'sku' | 'price_rappen' | 'active' | 'track_stock' | 'stock'
> & {
  product_options: Pick<TableRow<'product_options'>, 'name' | 'choices'>[];
  product_images: Pick<TableRow<'product_images'>, 'storage_path' | 'sort_order'>[];
};

export type CatalogShippingMethod = Pick<
  TableRow<'shipping_methods'>,
  'id' | 'kind' | 'name' | 'active' | 'postal_codes'
> & {
  shipping_rates: Pick<TableRow<'shipping_rates'>, 'from_subtotal_rappen' | 'price_rappen'>[];
};

export type ValidatedItem = {
  product_id: string;
  product_name: string;
  sku: string | null;
  options: ProductOptions;
  unit_price_rappen: number;
  quantity: number;
  line_total_rappen: number;
  image_path: string | null;
};

export type ValidatedOrder = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  postal_code: string;
  city: string;
  country: 'CH';
  shipping_method_id: string;
  shipping_kind: ShippingKind;
  shipping_name: string;
  subtotal_rappen: number;
  shipping_rappen: number;
  total_rappen: number;
  customer_note: string;
};

export type UntrustedCheckoutRequest = Partial<Omit<CheckoutRequest, 'customer'>> & {
  customer?: Partial<CheckoutRequest['customer']>;
};

export type CheckoutValidation =
  { ok: true; order: ValidatedOrder; items: ValidatedItem[] } | { ok: false; errors: string[] };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, maxLength = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function validateCheckout(
  request: UntrustedCheckoutRequest,
  products: CatalogProduct[],
  shippingMethods: CatalogShippingMethod[],
): CheckoutValidation {
  const errors: string[] = [];
  const customer = request.customer ?? {};
  const email = text(customer.email).toLowerCase();
  const firstName = text(customer.firstName, 100);
  const lastName = text(customer.lastName, 100);

  if (!emailPattern.test(email)) errors.push('Bitte gib eine gültige E-Mail-Adresse an.');
  if (!firstName) errors.push('Bitte gib deinen Vornamen an.');
  if (!lastName) errors.push('Bitte gib deinen Nachnamen an.');
  if (request.termsAccepted !== true) errors.push('Bitte akzeptiere die AGB.');

  const requestedItems = Array.isArray(request.items) ? request.items : [];
  if (requestedItems.length === 0) errors.push('Der Warenkorb ist leer.');

  const items: ValidatedItem[] = [];
  const quantityByProduct = new Map<string, number>();
  for (const requested of requestedItems) {
    const product = products.find((candidate) => candidate.id === requested?.productId);
    const quantity = Number(requested?.quantity);
    if (!product || !product.active) {
      errors.push('Ein Artikel im Warenkorb ist nicht mehr verfügbar.');
      continue;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxLineQuantity) {
      errors.push(`Ungültige Anzahl für ${product.name}.`);
      continue;
    }
    const options: ProductOptions = {};
    for (const option of product.product_options) {
      const choice = requested.options?.[option.name];
      if (!choice || !option.choices.includes(choice)) {
        errors.push(`Bitte wähle ${option.name} für ${product.name}.`);
      } else {
        options[option.name] = choice;
      }
    }
    quantityByProduct.set(product.id, (quantityByProduct.get(product.id) ?? 0) + quantity);
    const image = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
    items.push({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      options,
      unit_price_rappen: product.price_rappen,
      quantity,
      line_total_rappen: product.price_rappen * quantity,
      image_path: image?.storage_path ?? null,
    });
  }

  for (const [productId, quantity] of quantityByProduct) {
    const product = products.find((candidate) => candidate.id === productId)!;
    if (product.track_stock && quantity > (product.stock ?? 0)) {
      errors.push(
        (product.stock ?? 0) > 0
          ? `Von ${product.name} sind nur noch ${product.stock} Stück verfügbar.`
          : `${product.name} ist leider ausverkauft.`,
      );
    }
  }

  const method = shippingMethods.find((candidate) => candidate.id === request.shippingMethodId);
  if (!method || !method.active) {
    errors.push('Bitte wähle eine Versandart.');
  }

  const street = text(customer.street);
  const postalCode = normalizePostalCode(text(customer.postalCode, 10));
  const city = text(customer.city, 100);
  if (method && method.kind !== 'pickup') {
    if (!street) errors.push('Bitte gib Strasse und Hausnummer an.');
    if (!isSwissPostalCode(postalCode))
      errors.push('Bitte gib eine gültige Schweizer Postleitzahl an.');
    if (!city) errors.push('Bitte gib den Ort an.');
    if (
      method.kind === 'local_delivery' &&
      isSwissPostalCode(postalCode) &&
      !deliversTo(method.postal_codes, postalCode)
    ) {
      errors.push(`${method.name} ist für die Postleitzahl ${postalCode} nicht möglich.`);
    }
  }

  if (errors.length > 0 || !method) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  const subtotal = items.reduce((sum, item) => sum + item.line_total_rappen, 0);
  const shipping = shippingPriceRappen(method.shipping_rates, subtotal);
  return {
    ok: true,
    items,
    order: {
      email,
      first_name: firstName,
      last_name: lastName,
      phone: text(customer.phone, 40),
      street: method.kind === 'pickup' ? '' : street,
      postal_code: method.kind === 'pickup' ? '' : postalCode,
      city: method.kind === 'pickup' ? '' : city,
      country: 'CH',
      shipping_method_id: method.id,
      shipping_kind: method.kind,
      shipping_name: method.name,
      subtotal_rappen: subtotal,
      shipping_rappen: shipping,
      total_rappen: subtotal + shipping,
      customer_note: text(request.note, 1000),
    },
  };
}

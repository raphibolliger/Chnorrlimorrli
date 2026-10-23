import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  CatalogProduct,
  CatalogShippingMethod,
  UntrustedCheckoutRequest,
  validateCheckout,
} from './checkout.ts';

const book: CatalogProduct = {
  id: 'book-1',
  name: 'Chnorrlimorrli 1',
  sku: '00000',
  price_rappen: 4000,
  active: true,
  track_stock: true,
  stock: 2,
  product_options: [],
  product_images: [{ storage_path: 'seed/b.webp', sort_order: 0 }],
};
const socks: CatalogProduct = {
  id: 'socks',
  name: 'Socken',
  sku: '00004',
  price_rappen: 1000,
  active: true,
  track_stock: false,
  stock: null,
  product_options: [{ name: 'Grösse', choices: ['31-35', '39-46'] }],
  product_images: [],
};
const methods: CatalogShippingMethod[] = [
  {
    id: 'pickup',
    kind: 'pickup',
    name: 'Selbstabholung',
    active: true,
    postal_codes: [],
    shipping_rates: [{ from_subtotal_rappen: 0, price_rappen: 0 }],
  },
  {
    id: 'post',
    kind: 'postal',
    name: 'Postversand',
    active: true,
    postal_codes: [],
    shipping_rates: [
      { from_subtotal_rappen: 0, price_rappen: 0 },
      { from_subtotal_rappen: 1001, price_rappen: 1000 },
    ],
  },
  {
    id: 'local',
    kind: 'local_delivery',
    name: 'Lieferung im Freiamt',
    active: true,
    postal_codes: ['5612'],
    shipping_rates: [{ from_subtotal_rappen: 0, price_rappen: 500 }],
  },
];

function request(overrides: UntrustedCheckoutRequest = {}): UntrustedCheckoutRequest {
  return {
    items: [{ productId: 'book-1', quantity: 1, options: {} }],
    shippingMethodId: 'post',
    customer: {
      email: 'Lila@Example.com ',
      firstName: 'Lila',
      lastName: 'Muster',
      street: 'Dorfstrasse 1',
      postalCode: '5612',
      city: 'Villmergen',
    },
    termsAccepted: true,
    ...overrides,
  };
}

Deno.test('calculates totals with server-side prices and shipping', () => {
  const result = validateCheckout(request(), [book, socks], methods);
  assert(result.ok);
  assertEquals(result.order.subtotal_rappen, 4000);
  assertEquals(result.order.shipping_rappen, 1000);
  assertEquals(result.order.total_rappen, 5000);
  assertEquals(result.order.email, 'lila@example.com');
  assertEquals(result.items[0].image_path, 'seed/b.webp');
});

Deno.test('ships socks alone for free', () => {
  const result = validateCheckout(
    request({ items: [{ productId: 'socks', quantity: 1, options: { Grösse: '31-35' } }] }),
    [book, socks],
    methods,
  );
  assert(result.ok);
  assertEquals(result.order.shipping_rappen, 0);
});

Deno.test('requires valid option choices', () => {
  const result = validateCheckout(
    request({ items: [{ productId: 'socks', quantity: 1, options: { Grösse: '50' } }] }),
    [book, socks],
    methods,
  );
  assert(!result.ok);
  assertEquals(result.errors, ['Bitte wähle Grösse für Socken.']);
});

Deno.test('respects stock across lines', () => {
  const result = validateCheckout(
    request({
      items: [
        { productId: 'book-1', quantity: 2, options: {} },
        { productId: 'book-1', quantity: 1, options: {} },
      ],
    }),
    [book, socks],
    methods,
  );
  assert(!result.ok);
  assertEquals(result.errors, ['Von Chnorrlimorrli 1 sind nur noch 2 Stück verfügbar.']);
});

Deno.test('rejects inactive products and missing terms', () => {
  const result = validateCheckout(
    request({ termsAccepted: false }),
    [{ ...book, active: false }],
    methods,
  );
  assert(!result.ok);
  assert(result.errors.includes('Bitte akzeptiere die AGB.'));
  assert(result.errors.includes('Ein Artikel im Warenkorb ist nicht mehr verfügbar.'));
});

Deno.test('limits local delivery to its postal codes', () => {
  const outside = validateCheckout(
    request({ shippingMethodId: 'local', customer: { ...request().customer, postalCode: '8000' } }),
    [book],
    methods,
  );
  assert(!outside.ok);
  assertEquals(outside.errors, [
    'Lieferung im Freiamt ist für die Postleitzahl 8000 nicht möglich.',
  ]);
  const inside = validateCheckout(request({ shippingMethodId: 'local' }), [book], methods);
  assert(inside.ok);
  assertEquals(inside.order.shipping_rappen, 500);
});

Deno.test('pickup needs no address', () => {
  const result = validateCheckout(
    request({
      shippingMethodId: 'pickup',
      customer: { email: 'a@b.ch', firstName: 'A', lastName: 'B' },
    }),
    [book],
    methods,
  );
  assert(result.ok);
  assertEquals(result.order.street, '');
  assertEquals(result.order.total_rappen, 4000);
});

Deno.test('requires a Swiss address for postal shipping', () => {
  const result = validateCheckout(
    request({ customer: { email: 'a@b.ch', firstName: 'A', lastName: 'B', postalCode: '123' } }),
    [book],
    methods,
  );
  assert(!result.ok);
  assert(result.errors.includes('Bitte gib Strasse und Hausnummer an.'));
  assert(result.errors.includes('Bitte gib eine gültige Schweizer Postleitzahl an.'));
});

Deno.test('allows cash payment only together with pickup', () => {
  const pickupCash = validateCheckout(
    request({
      shippingMethodId: 'pickup',
      payment: 'cash',
      customer: { email: 'a@b.ch', firstName: 'A', lastName: 'B' },
    }),
    [book],
    methods,
  );
  assert(pickupCash.ok);
  assertEquals(pickupCash.order.payment_method, 'cash');

  const postalCash = validateCheckout(request({ payment: 'cash' }), [book], methods);
  assert(!postalCash.ok);
  assertEquals(postalCash.errors, [
    'Bezahlen bei der Abholung ist nur bei Selbstabholung möglich.',
  ]);

  const online = validateCheckout(request({ payment: 'online' }), [book], methods);
  assert(online.ok);
  assertEquals(online.order.payment_method, null);
});

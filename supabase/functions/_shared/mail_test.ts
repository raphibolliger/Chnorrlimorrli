import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { applyRedirect, parseConnectionString, signRequest } from './mail.ts';
import {
  adminNewOrder,
  escapeHtml,
  OrderMail,
  orderCancelled,
  orderConfirmation,
  orderDelivered,
  orderReadyForPickup,
  orderShipped,
} from './mail-templates.ts';

const order: OrderMail = {
  orderNumber: 1001,
  firstName: 'Lila',
  lastName: 'Muster',
  email: 'lila@example.com',
  phone: '079 000 00 00',
  street: 'Dorfstrasse 1',
  postalCode: '5612',
  city: 'Villmergen',
  shippingKind: 'postal',
  shippingName: 'Postversand',
  subtotalRappen: 5000,
  shippingRappen: 1000,
  totalRappen: 6000,
  customerNote: 'Bitte <b>schnell</b>',
  paymentMethod: 'twint',
  items: [
    { name: 'Chnorrlimorrli 2', options: {}, quantity: 1, lineTotalRappen: 4000 },
    {
      name: 'Chnorrlimorrli-Socken',
      options: { Grösse: '31-35' },
      quantity: 1,
      lineTotalRappen: 1000,
    },
  ],
  trackingNumber: '99.00.123456.12345678',
};

Deno.test('parses ACS connection strings', () => {
  assertEquals(
    parseConnectionString('endpoint=https://example.communication.azure.com/;accesskey=abc='),
    { endpoint: 'https://example.communication.azure.com', accessKey: 'abc=' },
  );
});

Deno.test('redirects mails and keeps the original recipient in the subject', () => {
  const redirected = applyRedirect(
    { to: 'kunde@example.com', subject: 'Bestellung', html: '', text: '' },
    'developer@chnorrlimorrli.ch',
  );
  assertEquals(redirected.to, 'developer@chnorrlimorrli.ch');
  assertEquals(redirected.subject, '[an kunde@example.com] Bestellung');
});

Deno.test('leaves mails untouched without redirect', () => {
  const message = { to: 'kunde@example.com', subject: 'Bestellung', html: '', text: '' };
  assertEquals(applyRedirect(message, undefined), message);
});

Deno.test('signs requests with the ACS HMAC scheme', async () => {
  const headers = await signRequest(
    { endpoint: 'https://example.communication.azure.com', accessKey: btoa('secret') },
    '/emails:send?api-version=2023-03-31',
    '{}',
    'Thu, 15 Oct 2026 10:00:00 GMT',
  );
  assertEquals(headers['x-ms-content-sha256'], 'RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=');
  assertEquals(
    headers.Authorization,
    'HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=7+hhVjsMUBj65L7uYctx1nkVu5zDtsWGGFrCH17J714=',
  );
});

Deno.test('escapes customer input in HTML', () => {
  assertEquals(escapeHtml('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
  const mail = orderConfirmation(order, 'https://example.com');
  assert(!mail.html.includes('<b>schnell</b>'));
  assertStringIncludes(mail.html, '&lt;b&gt;schnell&lt;/b&gt;');
});

Deno.test('order confirmation lists items, totals and address', () => {
  const mail = orderConfirmation(order, 'https://example.com');
  assertEquals(mail.subject, 'Deine Bestellung 1001 bei Chnorrlimorrli');
  assertStringIncludes(mail.text, '1 x Chnorrlimorrli-Socken (Grösse: 31-35): CHF 10.00');
  assertStringIncludes(mail.text, 'Total: CHF 60.00');
  assertStringIncludes(mail.text, 'Dorfstrasse 1');
  assertStringIncludes(mail.text, 'mit TWINT');
});

Deno.test('pickup orders show the pickup location instead of an address', () => {
  const mail = orderConfirmation(
    {
      ...order,
      shippingKind: 'pickup',
      shippingName: 'Selbstabholung',
      shippingRappen: 0,
      pickupLocation: 'Verein Chnorrlimorrli, 5612 Villmergen',
    },
    'https://example.com',
  );
  assertStringIncludes(mail.text, 'Abholung: Verein Chnorrlimorrli, 5612 Villmergen');
  assertStringIncludes(mail.text, 'Selbstabholung: kostenlos');
  assert(!mail.text.includes('Lieferadresse'));
});

Deno.test('status mails have their own subjects', () => {
  assertStringIncludes(orderShipped(order, 'x').text, '99.00.123456.12345678');
  assertStringIncludes(orderReadyForPickup(order, 'x').subject, 'zur Abholung bereit');
  assertStringIncludes(orderDelivered(order, 'x').subject, 'geliefert');
  assertStringIncludes(orderCancelled(order, 'x', true).text, 'zurückerstattet');
  assertStringIncludes(orderCancelled(order, 'x', false).text, 'kein Betrag');
  assertStringIncludes(adminNewOrder(order, 'x').subject, 'Neue Bestellung 1001');
});

import { formatChf } from './pricing.ts';

export type ShippingKind = 'pickup' | 'postal' | 'local_delivery';

export interface OrderMailItem {
  name: string;
  options: Record<string, string>;
  quantity: number;
  lineTotalRappen: number;
}

export interface OrderMail {
  orderNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  shippingKind: ShippingKind;
  shippingName: string;
  subtotalRappen: number;
  shippingRappen: number;
  totalRappen: number;
  customerNote: string | null;
  paymentMethod: string | null;
  items: OrderMailItem[];
  pickupLocation?: string | null;
  pickupHours?: string | null;
  trackingNumber?: string | null;
}

export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

const paymentLabels: Record<string, string> = {
  card: 'Karte',
  twint: 'TWINT',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  link: 'Link',
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function paymentLabel(method: string | null): string {
  return method ? (paymentLabels[method] ?? method) : '';
}

function optionText(options: Record<string, string>): string {
  return Object.entries(options)
    .map(([name, value]) => `${name}: ${value}`)
    .join(', ');
}

function addressLines(order: OrderMail): string[] {
  if (order.shippingKind === 'pickup') {
    return [];
  }
  return [
    `${order.firstName} ${order.lastName}`,
    order.street ?? '',
    `${order.postalCode ?? ''} ${order.city ?? ''}`.trim(),
  ].filter(Boolean);
}

function layout(siteUrl: string, title: string, body: string): string {
  return `<!doctype html>
<html lang="de-CH">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#fffaf0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf0;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#e7c003;padding:20px 24px;">
<img src="${siteUrl}/images/logo-email.png" width="48" height="48" alt="" style="vertical-align:middle;border-radius:24px;">
<span style="font-size:22px;font-weight:700;color:#1f2a5c;vertical-align:middle;margin-left:10px;">Chnorrlimorrli</span>
</td></tr>
<tr><td style="padding:24px;font-size:16px;line-height:1.5;">${body}</td></tr>
<tr><td style="background:#1f2a5c;color:#ffffff;padding:16px 24px;font-size:13px;line-height:1.5;">
Verein Chnorrlimorrli · 5612 Villmergen<br>
Fragen? Antworte einfach auf diese E-Mail oder schreib an <a href="mailto:hoi@chnorrlimorrli.ch" style="color:#e7c003;">hoi@chnorrlimorrli.ch</a>.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;">${text}</p>`;
}

function itemsTable(order: OrderMail): string {
  const rows = order.items
    .map(
      (item) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #f0e6c8;">${item.quantity} × ${escapeHtml(item.name)}${
        Object.keys(item.options).length
          ? `<br><span style="color:#6b6b6b;font-size:14px;">${escapeHtml(optionText(item.options))}</span>`
          : ''
      }</td>
<td style="padding:8px 0;border-bottom:1px solid #f0e6c8;text-align:right;white-space:nowrap;">${formatChf(item.lineTotalRappen)}</td>
</tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;font-size:15px;">
${rows}
<tr><td style="padding:8px 0;">Zwischensumme</td><td style="padding:8px 0;text-align:right;">${formatChf(order.subtotalRappen)}</td></tr>
<tr><td style="padding:4px 0;">${escapeHtml(order.shippingName)}</td><td style="padding:4px 0;text-align:right;">${
    order.shippingRappen === 0 ? 'kostenlos' : formatChf(order.shippingRappen)
  }</td></tr>
<tr><td style="padding:8px 0;font-weight:700;border-top:2px solid #1f2a5c;">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:2px solid #1f2a5c;">${formatChf(order.totalRappen)}</td></tr>
</table>`;
}

function itemsText(order: OrderMail): string {
  const lines = order.items.map(
    (item) =>
      `${item.quantity} x ${item.name}${
        Object.keys(item.options).length ? ` (${optionText(item.options)})` : ''
      }: ${formatChf(item.lineTotalRappen)}`,
  );
  return [
    ...lines,
    `Zwischensumme: ${formatChf(order.subtotalRappen)}`,
    `${order.shippingName}: ${order.shippingRappen === 0 ? 'kostenlos' : formatChf(order.shippingRappen)}`,
    `Total: ${formatChf(order.totalRappen)}`,
  ].join('\n');
}

function deliveryHtml(order: OrderMail): string {
  if (order.shippingKind === 'pickup') {
    const where = [order.pickupLocation, order.pickupHours]
      .filter(Boolean)
      .map((v) => escapeHtml(v!));
    return paragraph(
      `<strong>Abholung:</strong> ${where.join(' · ') || 'Villmergen'}. Wir melden uns, sobald deine Bestellung bereitliegt.`,
    );
  }
  return paragraph(
    `<strong>Lieferadresse:</strong><br>${addressLines(order).map(escapeHtml).join('<br>')}`,
  );
}

function deliveryText(order: OrderMail): string {
  if (order.shippingKind === 'pickup') {
    const where = [order.pickupLocation, order.pickupHours].filter(Boolean).join(' · ');
    return `Abholung: ${where || 'Villmergen'}. Wir melden uns, sobald deine Bestellung bereitliegt.`;
  }
  return `Lieferadresse:\n${addressLines(order).join('\n')}`;
}

export function orderConfirmation(order: OrderMail, siteUrl: string): MailContent {
  const subject = `Deine Bestellung ${order.orderNumber} bei Chnorrlimorrli`;
  const greeting = `Hoi ${escapeHtml(order.firstName)}`;
  const html = layout(
    siteUrl,
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;color:#1f2a5c;">Merci vilmol für deine Bestellung!</h1>
${paragraph(
  `${greeting}, wir haben deine Bestellung <strong>${order.orderNumber}</strong> und deine Zahlung${
    order.paymentMethod ? ` mit ${escapeHtml(paymentLabel(order.paymentMethod))}` : ''
  } erhalten.`,
)}
${itemsTable(order)}
${deliveryHtml(order)}
${order.customerNote ? paragraph(`<strong>Deine Bemerkung:</strong><br>${escapeHtml(order.customerNote)}`) : ''}
${paragraph('Die Zahlungsquittung erhältst du separat von unserem Zahlungsanbieter Stripe.')}
${paragraph('Herzliche Grüsse<br>Verein Chnorrlimorrli')}`,
  );
  const text = [
    `Hoi ${order.firstName}`,
    '',
    `Merci vilmol für deine Bestellung! Wir haben deine Bestellung ${order.orderNumber} und deine Zahlung${
      order.paymentMethod ? ` mit ${paymentLabel(order.paymentMethod)}` : ''
    } erhalten.`,
    '',
    itemsText(order),
    '',
    deliveryText(order),
    ...(order.customerNote ? ['', `Deine Bemerkung: ${order.customerNote}`] : []),
    '',
    'Die Zahlungsquittung erhältst du separat von unserem Zahlungsanbieter Stripe.',
    '',
    'Herzliche Grüsse',
    'Verein Chnorrlimorrli',
  ].join('\n');
  return { subject, html, text };
}

export function adminNewOrder(order: OrderMail, siteUrl: string): MailContent {
  const subject = `Neue Bestellung ${order.orderNumber}: ${order.shippingName}, ${formatChf(order.totalRappen)}`;
  const contact = [`${order.firstName} ${order.lastName}`, order.email, order.phone ?? ''].filter(
    Boolean,
  );
  const html = layout(
    siteUrl,
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;color:#1f2a5c;">Neue Bestellung ${order.orderNumber}</h1>
${paragraph(`<strong>Kontakt:</strong><br>${contact.map(escapeHtml).join('<br>')}`)}
${itemsTable(order)}
${deliveryHtml(order)}
${order.customerNote ? paragraph(`<strong>Bemerkung:</strong><br>${escapeHtml(order.customerNote)}`) : ''}
${paragraph(`Bezahlt mit ${escapeHtml(paymentLabel(order.paymentMethod) || 'Stripe')}.`)}
${paragraph(`<a href="${siteUrl}/admin/bestellungen" style="color:#1f2a5c;font-weight:700;">Bestellung in der Verwaltung öffnen</a>`)}`,
  );
  const text = [
    `Neue Bestellung ${order.orderNumber}`,
    '',
    `Kontakt: ${contact.join(', ')}`,
    '',
    itemsText(order),
    '',
    deliveryText(order),
    ...(order.customerNote ? ['', `Bemerkung: ${order.customerNote}`] : []),
    '',
    `Bezahlt mit ${paymentLabel(order.paymentMethod) || 'Stripe'}.`,
    `${siteUrl}/admin/bestellungen`,
  ].join('\n');
  return { subject, html, text };
}

function statusMail(
  order: OrderMail,
  siteUrl: string,
  subject: string,
  headline: string,
  sentences: string[],
): MailContent {
  const html = layout(
    siteUrl,
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;color:#1f2a5c;">${escapeHtml(headline)}</h1>
${paragraph(`Hoi ${escapeHtml(order.firstName)}`)}
${sentences.map((sentence) => paragraph(sentence)).join('\n')}
${itemsTable(order)}
${paragraph('Herzliche Grüsse<br>Verein Chnorrlimorrli')}`,
  );
  const text = [
    `Hoi ${order.firstName}`,
    '',
    ...sentences.map((sentence) => sentence.replace(/<[^>]+>/g, '')),
    '',
    itemsText(order),
    '',
    'Herzliche Grüsse',
    'Verein Chnorrlimorrli',
  ].join('\n');
  return { subject, html, text };
}

export function orderShipped(order: OrderMail, siteUrl: string): MailContent {
  const tracking = order.trackingNumber
    ? [
        `Deine Sendungsnummer: <strong>${escapeHtml(order.trackingNumber)}</strong>. Du kannst die Sendung auf <a href="https://service.post.ch/ekp-web/ui/entry/search/${encodeURIComponent(order.trackingNumber)}" style="color:#1f2a5c;">post.ch</a> verfolgen.`,
      ]
    : [];
  return statusMail(
    order,
    siteUrl,
    `Deine Bestellung ${order.orderNumber} ist unterwegs`,
    'Deine Bestellung ist unterwegs!',
    [`Deine Bestellung <strong>${order.orderNumber}</strong> wurde verschickt.`, ...tracking],
  );
}

export function orderReadyForPickup(order: OrderMail, siteUrl: string): MailContent {
  const where = [order.pickupLocation, order.pickupHours]
    .filter(Boolean)
    .map((v) => escapeHtml(v!));
  return statusMail(
    order,
    siteUrl,
    `Deine Bestellung ${order.orderNumber} liegt zur Abholung bereit`,
    'Deine Bestellung liegt bereit!',
    [
      `Deine Bestellung <strong>${order.orderNumber}</strong> kann abgeholt werden.`,
      `Abholort: ${where.join(' · ') || 'Villmergen'}. Antworte einfach auf diese E-Mail, um einen Termin abzumachen.`,
    ],
  );
}

export function orderDelivered(order: OrderMail, siteUrl: string): MailContent {
  return statusMail(
    order,
    siteUrl,
    `Deine Bestellung ${order.orderNumber} wurde geliefert`,
    'Viel Freude mit Chnorrlimorrli!',
    [
      `Deine Bestellung <strong>${order.orderNumber}</strong> wurde geliefert.`,
      'Wir wünschen dir und deinen Kindern viel Freude beim Lesen und Entdecken.',
    ],
  );
}

export function orderCancelled(order: OrderMail, siteUrl: string, refunded: boolean): MailContent {
  return statusMail(
    order,
    siteUrl,
    `Deine Bestellung ${order.orderNumber} wurde storniert`,
    'Deine Bestellung wurde storniert',
    [
      `Deine Bestellung <strong>${order.orderNumber}</strong> wurde storniert.`,
      refunded
        ? `Den Betrag von ${formatChf(order.totalRappen)} haben wir zurückerstattet. Je nach Zahlungsmittel dauert es einige Tage, bis er sichtbar ist.`
        : 'Es wurde kein Betrag belastet.',
    ],
  );
}

import { optionsText, paymentMethodLabel, ProductOptions, ShippingKind } from './orders.ts';
import { formatChf, formatShippingPrice } from './pricing.ts';

export interface OrderMailItem {
  name: string;
  options: ProductOptions;
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
  refunded: boolean;
  items: OrderMailItem[];
  pickupLocation: string | null;
  pickupHours: string | null;
  trackingNumber: string | null;
}

export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

type Run = string | { bold: string } | { link: string; href: string };
type Block = { lines: Run[][] } | 'items';

interface Mail {
  subject: string;
  headline: string;
  blocks: Block[];
}

const navy = '#1f2a5c';

function bold(value: string | number): Run {
  return { bold: String(value) };
}

function link(label: string, href: string): Run {
  return { link: label, href };
}

function paragraph(...runs: Run[]): Block {
  return { lines: [runs] };
}

function lines(...runs: Run[]): Block {
  return { lines: runs.map((run) => [run]) };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function runHtml(run: Run): string {
  if (typeof run === 'string') {
    return escapeHtml(run);
  }
  if ('bold' in run) {
    return `<strong>${escapeHtml(run.bold)}</strong>`;
  }
  return `<a href="${escapeHtml(run.href)}" style="color:${navy};font-weight:700;">${escapeHtml(run.link)}</a>`;
}

function runText(run: Run): string {
  if (typeof run === 'string') {
    return run;
  }
  return 'bold' in run ? run.bold : `${run.link} (${run.href})`;
}

function itemsHtml(order: OrderMail): string {
  const cell = 'padding:8px 0;border-bottom:1px solid #f0e6c8;';
  const rows = order.items
    .map((item) => {
      const options = Object.keys(item.options).length
        ? `<br><span style="color:#6b6b6b;font-size:14px;">${escapeHtml(optionsText(item.options))}</span>`
        : '';
      return `<tr><td style="${cell}">${item.quantity} × ${escapeHtml(item.name)}${options}</td><td style="${cell}text-align:right;white-space:nowrap;">${formatChf(item.lineTotalRappen)}</td></tr>`;
    })
    .join('\n');
  const total = `padding:8px 0;font-weight:700;border-top:2px solid ${navy};`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;font-size:15px;">
${rows}
<tr><td style="padding:8px 0;">Zwischensumme</td><td style="padding:8px 0;text-align:right;">${formatChf(order.subtotalRappen)}</td></tr>
<tr><td style="padding:4px 0;">${escapeHtml(order.shippingName)}</td><td style="padding:4px 0;text-align:right;">${formatShippingPrice(order.shippingRappen)}</td></tr>
<tr><td style="${total}">Total</td><td style="${total}text-align:right;">${formatChf(order.totalRappen)}</td></tr>
</table>`;
}

function itemsText(order: OrderMail): string {
  return [
    ...order.items.map((item) => {
      const options = Object.keys(item.options).length ? ` (${optionsText(item.options)})` : '';
      return `${item.quantity} x ${item.name}${options}: ${formatChf(item.lineTotalRappen)}`;
    }),
    `Zwischensumme: ${formatChf(order.subtotalRappen)}`,
    `${order.shippingName}: ${formatShippingPrice(order.shippingRappen)}`,
    `Total: ${formatChf(order.totalRappen)}`,
  ].join('\n');
}

function blockHtml(block: Block, order: OrderMail): string {
  if (block === 'items') {
    return itemsHtml(order);
  }
  const content = block.lines.map((line) => line.map(runHtml).join('')).join('<br>');
  return `<p style="margin:0 0 16px;">${content}</p>`;
}

function blockText(block: Block, order: OrderMail): string {
  if (block === 'items') {
    return itemsText(order);
  }
  return block.lines.map((line) => line.map(runText).join('')).join('\n');
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
<span style="font-size:22px;font-weight:700;color:${navy};vertical-align:middle;margin-left:10px;">Chnorrlimorrli</span>
</td></tr>
<tr><td style="padding:24px;font-size:16px;line-height:1.5;">${body}</td></tr>
<tr><td style="background:${navy};color:#ffffff;padding:16px 24px;font-size:13px;line-height:1.5;">
Verein Chnorrlimorrli · 5612 Villmergen<br>
Fragen? Antworte einfach auf diese E-Mail oder schreib an <a href="mailto:hoi@chnorrlimorrli.ch" style="color:#e7c003;">hoi@chnorrlimorrli.ch</a>.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function render(siteUrl: string, order: OrderMail, mail: Mail): MailContent {
  const headline = `<h1 style="margin:0 0 16px;font-size:24px;color:${navy};">${escapeHtml(mail.headline)}</h1>`;
  const body = [headline, ...mail.blocks.map((block) => blockHtml(block, order))].join('\n');
  return {
    subject: mail.subject,
    html: layout(siteUrl, mail.subject, body),
    text: [mail.headline, ...mail.blocks.map((block) => blockText(block, order))].join('\n\n'),
  };
}

function pickupPlace(order: OrderMail): string {
  return [order.pickupLocation, order.pickupHours].filter(Boolean).join(' · ') || 'Villmergen';
}

function delivery(order: OrderMail): Block {
  if (order.shippingKind === 'pickup') {
    return paragraph(
      bold('Abholung:'),
      ` ${pickupPlace(order)}. Wir melden uns, sobald deine Bestellung bereitliegt.`,
    );
  }
  return lines(
    bold('Lieferadresse:'),
    `${order.firstName} ${order.lastName}`,
    ...[order.street, `${order.postalCode ?? ''} ${order.city ?? ''}`.trim()].filter(
      (line): line is string => Boolean(line),
    ),
  );
}

function customerNote(title: string, order: OrderMail): Block[] {
  return order.customerNote ? [lines(bold(title), order.customerNote)] : [];
}

const regards = lines('Herzliche Grüsse', 'Verein Chnorrlimorrli');

export function orderConfirmation(order: OrderMail, siteUrl: string): MailContent {
  const paymentMethod = paymentMethodLabel(order.paymentMethod);
  return render(siteUrl, order, {
    subject: `Deine Bestellung ${order.orderNumber} bei Chnorrlimorrli`,
    headline: 'Merci vilmol für deine Bestellung!',
    blocks: [
      paragraph(
        `Hoi ${order.firstName}, wir haben deine Bestellung `,
        bold(order.orderNumber),
        ` und deine Zahlung${paymentMethod ? ` mit ${paymentMethod}` : ''} erhalten.`,
      ),
      'items',
      delivery(order),
      ...customerNote('Deine Bemerkung:', order),
      paragraph('Die Zahlungsquittung erhältst du separat von unserem Zahlungsanbieter Stripe.'),
      regards,
    ],
  });
}

export function adminNewOrder(order: OrderMail, siteUrl: string): MailContent {
  return render(siteUrl, order, {
    subject: `Neue Bestellung ${order.orderNumber}: ${order.shippingName}, ${formatChf(order.totalRappen)}`,
    headline: `Neue Bestellung ${order.orderNumber}`,
    blocks: [
      lines(
        bold('Kontakt:'),
        `${order.firstName} ${order.lastName}`,
        order.email,
        ...(order.phone ? [order.phone] : []),
      ),
      'items',
      delivery(order),
      ...customerNote('Bemerkung:', order),
      paragraph(`Bezahlt mit ${paymentMethodLabel(order.paymentMethod) ?? 'Stripe'}.`),
      paragraph(link('Bestellung in der Verwaltung öffnen', `${siteUrl}/admin/bestellungen`)),
    ],
  });
}

function statusMail(
  order: OrderMail,
  siteUrl: string,
  mail: { subject: string; headline: string; message: Block[] },
): MailContent {
  return render(siteUrl, order, {
    subject: mail.subject,
    headline: mail.headline,
    blocks: [paragraph(`Hoi ${order.firstName}`), ...mail.message, 'items', regards],
  });
}

export function orderShipped(order: OrderMail, siteUrl: string): MailContent {
  const tracking = order.trackingNumber
    ? [
        paragraph(
          'Deine Sendungsnummer: ',
          bold(order.trackingNumber),
          '. Du kannst die Sendung auf ',
          link(
            'post.ch',
            `https://service.post.ch/ekp-web/ui/entry/search/${encodeURIComponent(order.trackingNumber)}`,
          ),
          ' verfolgen.',
        ),
      ]
    : [];
  return statusMail(order, siteUrl, {
    subject: `Deine Bestellung ${order.orderNumber} ist unterwegs`,
    headline: 'Deine Bestellung ist unterwegs!',
    message: [
      paragraph('Deine Bestellung ', bold(order.orderNumber), ' wurde verschickt.'),
      ...tracking,
    ],
  });
}

export function orderReadyForPickup(order: OrderMail, siteUrl: string): MailContent {
  return statusMail(order, siteUrl, {
    subject: `Deine Bestellung ${order.orderNumber} liegt zur Abholung bereit`,
    headline: 'Deine Bestellung liegt bereit!',
    message: [
      paragraph('Deine Bestellung ', bold(order.orderNumber), ' kann abgeholt werden.'),
      paragraph(
        `Abholort: ${pickupPlace(order)}. Antworte einfach auf diese E-Mail, um einen Termin abzumachen.`,
      ),
    ],
  });
}

export function orderDelivered(order: OrderMail, siteUrl: string): MailContent {
  return statusMail(order, siteUrl, {
    subject: `Deine Bestellung ${order.orderNumber} wurde geliefert`,
    headline: 'Viel Freude mit Chnorrlimorrli!',
    message: [
      paragraph('Deine Bestellung ', bold(order.orderNumber), ' wurde geliefert.'),
      paragraph('Wir wünschen dir und deinen Kindern viel Freude beim Lesen und Entdecken.'),
    ],
  });
}

export function orderCancelled(order: OrderMail, siteUrl: string): MailContent {
  return statusMail(order, siteUrl, {
    subject: `Deine Bestellung ${order.orderNumber} wurde storniert`,
    headline: 'Deine Bestellung wurde storniert',
    message: [
      paragraph('Deine Bestellung ', bold(order.orderNumber), ' wurde storniert.'),
      paragraph(
        order.refunded
          ? `Den Betrag von ${formatChf(order.totalRappen)} haben wir zurückerstattet. Je nach Zahlungsmittel dauert es einige Tage, bis er sichtbar ist.`
          : 'Es wurde kein Betrag belastet.',
      ),
    ],
  });
}

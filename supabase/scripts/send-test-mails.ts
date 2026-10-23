import { mailSettingsFromEnv, sendMail } from '../functions/_shared/mail.ts';
import {
  adminNewOrder,
  OrderMail,
  orderCancelled,
  orderConfirmation,
  orderDelivered,
  orderReadyForPickup,
  orderShipped,
} from '../functions/_shared/mail-templates.ts';

const recipient = Deno.args[0];
const siteUrl = Deno.env.get('SITE_URL') ?? 'https://raphibolliger.github.io/Chnorrlimorrli';

if (!recipient?.endsWith('@chnorrlimorrli.ch') || recipient === 'hoi@chnorrlimorrli.ch') {
  console.error('Usage: send-test-mails.ts developer@chnorrlimorrli.ch');
  Deno.exit(1);
}

const postalOrder: OrderMail = {
  orderNumber: 9001,
  firstName: 'Test',
  lastName: 'Bestellung',
  email: recipient,
  phone: '079 000 00 00',
  street: 'Teststrasse 1',
  postalCode: '5612',
  city: 'Villmergen',
  shippingKind: 'postal',
  shippingName: 'Postversand',
  subtotalRappen: 5000,
  shippingRappen: 1000,
  totalRappen: 6000,
  customerNote: 'Testbestellung aus dem Mail-Test',
  paymentMethod: 'twint',
  refunded: false,
  paymentDue: false,
  items: [
    {
      name: 'Chnorrlimorrli 2 – und die Könige des Freiamts',
      options: {},
      quantity: 1,
      lineTotalRappen: 4000,
    },
    {
      name: 'Chnorrlimorrli-Socken',
      options: { Grösse: '31-35' },
      quantity: 1,
      lineTotalRappen: 1000,
    },
  ],
  pickupLocation: null,
  pickupHours: null,
  trackingNumber: '99.00.123456.12345678',
  orderUrl: `${siteUrl}/bestellung?code=00000000-0000-4000-8000-000000000000`,
};
const pickupOrder: OrderMail = {
  ...postalOrder,
  orderNumber: 9002,
  shippingKind: 'pickup',
  shippingName: 'Selbstabholung',
  shippingRappen: 0,
  totalRappen: 5000,
  pickupLocation: 'Verein Chnorrlimorrli, 5612 Villmergen',
  pickupHours: 'Nach Absprache via E-Mail oder Telefon',
};

const mails = [
  orderConfirmation(postalOrder, siteUrl),
  adminNewOrder(postalOrder, siteUrl),
  orderShipped(postalOrder, siteUrl),
  orderReadyForPickup(pickupOrder, siteUrl),
  orderDelivered(postalOrder, siteUrl),
  orderCancelled({ ...postalOrder, refunded: true }, siteUrl),
];

const settings = { ...mailSettingsFromEnv(), redirectTo: undefined };
for (const mail of mails) {
  await sendMail({ ...mail, to: recipient, subject: `[Test] ${mail.subject}` }, settings);
  console.log(`sent: ${mail.subject}`);
}

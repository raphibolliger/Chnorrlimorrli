import type { Database } from './database.types.ts';

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

export type TableRow<Name extends keyof Tables> = Tables[Name]['Row'];
export type ShippingKind = Enums['shipping_kind'];
export type PaymentStatus = Enums['payment_status'];
export type FulfillmentStatus = Enums['fulfillment_status'];
export type ProductOptions = Record<string, string>;

export interface CheckoutRequest {
  items: { productId: string; quantity: number; options: ProductOptions }[];
  shippingMethodId: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    street: string;
    postalCode: string;
    city: string;
  };
  note: string;
  termsAccepted: boolean;
  returnBaseUrl: string;
}

export type OrderSummary = Pick<
  TableRow<'orders'>,
  | 'order_number'
  | 'created_at'
  | 'payment_status'
  | 'fulfillment_status'
  | 'first_name'
  | 'email'
  | 'shipping_kind'
  | 'shipping_name'
  | 'subtotal_rappen'
  | 'shipping_rappen'
  | 'total_rappen'
  | 'payment_method'
  | 'tracking_number'
> & {
  order_items: (Pick<TableRow<'order_items'>, 'product_name' | 'quantity' | 'line_total_rappen'> & {
    options: ProductOptions;
  })[];
  shipping_methods: Pick<TableRow<'shipping_methods'>, 'pickup_location' | 'pickup_hours'> | null;
};

export const orderSummaryColumns =
  'order_number, created_at, payment_status, fulfillment_status, first_name, email, shipping_kind, shipping_name, subtotal_rappen, shipping_rappen, total_rappen, payment_method, tracking_number, order_items(product_name, options, quantity, line_total_rappen), shipping_methods(pickup_location, pickup_hours)';

export function orderPagePath(accessToken: string): string {
  return `bestellung?code=${accessToken}`;
}

export function isAccessToken(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

export type FulfillmentAction = Exclude<FulfillmentStatus, 'new' | 'cancelled'>;
export type OrderAction = FulfillmentAction | 'cancel';

export const fulfillmentFlow: Record<ShippingKind, FulfillmentAction[]> = {
  pickup: ['processing', 'ready_for_pickup', 'delivered'],
  postal: ['processing', 'shipped', 'delivered'],
  local_delivery: ['processing', 'delivered'],
};

export const fulfillmentMailKinds: Record<
  FulfillmentAction,
  'ready_for_pickup' | 'shipped' | 'delivered' | null
> = {
  processing: null,
  ready_for_pickup: 'ready_for_pickup',
  shipped: 'shipped',
  delivered: 'delivered',
};

export function sendsCustomerMail(
  action: OrderAction,
  order: Pick<TableRow<'orders'>, 'paid_at'>,
): boolean {
  return action === 'cancel' ? order.paid_at !== null : fulfillmentMailKinds[action] !== null;
}

export function fulfillmentStepLabel(status: FulfillmentAction, kind: ShippingKind): string {
  switch (status) {
    case 'processing':
      return 'In Arbeit';
    case 'ready_for_pickup':
      return 'Abholbereit';
    case 'shipped':
      return 'Versandt';
    case 'delivered':
      return kind === 'pickup' ? 'Abgeholt' : 'Geliefert';
  }
}

export interface OrderUpdateRequest {
  orderId: string;
  action: OrderAction;
  trackingNumber: string;
  sendMail: boolean;
}

export interface OrderUpdateResult {
  refunded: boolean;
  mailed: boolean;
}

const paymentMethodLabels: Record<string, string> = {
  card: 'Karte',
  twint: 'TWINT',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  link: 'Link',
};

export function paymentMethodLabel(method: string | null): string | null {
  return method === null ? null : (paymentMethodLabels[method] ?? method);
}

export function optionsText(options: ProductOptions): string {
  return Object.entries(options)
    .map(([name, value]) => `${name}: ${value}`)
    .join(', ');
}

export function pickupPlace(location: string | null, hours: string | null): string {
  return [location, hours].filter(Boolean).join(' · ') || 'Villmergen';
}

export function trackingUrl(trackingNumber: string): string {
  return `https://service.post.ch/ekp-web/ui/entry/search/${encodeURIComponent(trackingNumber)}`;
}

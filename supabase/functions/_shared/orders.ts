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
  | 'payment_status'
  | 'first_name'
  | 'email'
  | 'shipping_kind'
  | 'shipping_name'
  | 'subtotal_rappen'
  | 'shipping_rappen'
  | 'total_rappen'
> & {
  order_items: (Pick<TableRow<'order_items'>, 'product_name' | 'quantity' | 'line_total_rappen'> & {
    options: ProductOptions;
  })[];
};

export type FulfillmentAction = Exclude<FulfillmentStatus, 'new' | 'cancelled'>;
export type OrderAction = FulfillmentAction | 'cancel';

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

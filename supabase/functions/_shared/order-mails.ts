import { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { mailSettingsFromEnv, sendMail } from './mail.ts';
import {
  adminNewOrder,
  MailContent,
  OrderMail,
  orderCancelled,
  orderConfirmation,
  orderDelivered,
  orderReadyForPickup,
  orderShipped,
} from './mail-templates.ts';

export type CustomerMailKind =
  'confirmation' | 'shipped' | 'ready_for_pickup' | 'delivered' | 'cancelled';

export async function loadOrderMail(supabase: SupabaseClient, orderId: string): Promise<OrderMail> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*), shipping_methods(pickup_location, pickup_hours)')
    .eq('id', orderId)
    .single();
  if (error) {
    throw error;
  }
  return {
    orderNumber: order.order_number,
    firstName: order.first_name,
    lastName: order.last_name,
    email: order.email,
    phone: order.phone,
    street: order.street,
    postalCode: order.postal_code,
    city: order.city,
    shippingKind: order.shipping_kind,
    shippingName: order.shipping_name,
    subtotalRappen: order.subtotal_rappen,
    shippingRappen: order.shipping_rappen,
    totalRappen: order.total_rappen,
    customerNote: order.customer_note,
    paymentMethod: order.payment_method,
    trackingNumber: order.tracking_number,
    pickupLocation: order.shipping_methods?.pickup_location ?? null,
    pickupHours: order.shipping_methods?.pickup_hours ?? null,
    items: order.order_items.map(
      (item: {
        product_name: string;
        options: Record<string, string>;
        quantity: number;
        line_total_rappen: number;
      }) => ({
        name: item.product_name,
        options: item.options ?? {},
        quantity: item.quantity,
        lineTotalRappen: item.line_total_rappen,
      }),
    ),
  };
}

function siteUrl(): string {
  return (Deno.env.get('SITE_URL') ?? 'http://localhost:4200').replace(/\/$/, '');
}

function customerContent(kind: CustomerMailKind, order: OrderMail, refunded: boolean): MailContent {
  switch (kind) {
    case 'confirmation':
      return orderConfirmation(order, siteUrl());
    case 'shipped':
      return orderShipped(order, siteUrl());
    case 'ready_for_pickup':
      return orderReadyForPickup(order, siteUrl());
    case 'delivered':
      return orderDelivered(order, siteUrl());
    case 'cancelled':
      return orderCancelled(order, siteUrl(), refunded);
  }
}

async function logMail(supabase: SupabaseClient, orderId: string, kind: string, detail: string) {
  await supabase.rpc('log_order_event', { p_order_id: orderId, p_kind: kind, p_detail: detail });
}

export async function sendCustomerMail(
  supabase: SupabaseClient,
  orderId: string,
  kind: CustomerMailKind,
  refunded = false,
): Promise<boolean> {
  try {
    const order = await loadOrderMail(supabase, orderId);
    const content = customerContent(kind, order, refunded);
    await sendMail({ to: order.email, ...content }, mailSettingsFromEnv());
    await logMail(supabase, orderId, 'mail_sent', content.subject);
    return true;
  } catch (error) {
    console.error('customer mail failed', error);
    await logMail(supabase, orderId, 'mail_failed', `${kind}: ${String(error)}`);
    return false;
  }
}

export async function sendAdminNotification(
  supabase: SupabaseClient,
  orderId: string,
): Promise<void> {
  const recipients = (Deno.env.get('ADMIN_NOTIFICATION_TO') ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    return;
  }
  try {
    const order = await loadOrderMail(supabase, orderId);
    const content = adminNewOrder(order, siteUrl());
    for (const recipient of recipients) {
      await sendMail({ to: recipient, ...content }, mailSettingsFromEnv());
    }
  } catch (error) {
    console.error('admin notification failed', error);
    await logMail(supabase, orderId, 'mail_failed', `admin: ${String(error)}`);
  }
}

import { AdminClient } from './clients.ts';
import { envList, siteUrl } from './env.ts';
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
import { orderPagePath, ProductOptions } from './orders.ts';

export type CustomerMailKind =
  'confirmation' | 'shipped' | 'ready_for_pickup' | 'delivered' | 'cancelled';

const customerTemplates: Record<
  CustomerMailKind,
  (order: OrderMail, siteUrl: string) => MailContent
> = {
  confirmation: orderConfirmation,
  shipped: orderShipped,
  ready_for_pickup: orderReadyForPickup,
  delivered: orderDelivered,
  cancelled: orderCancelled,
};

export async function loadOrderMail(supabase: AdminClient, orderId: string): Promise<OrderMail> {
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), shipping_methods(pickup_location, pickup_hours)')
    .eq('id', orderId)
    .single()
    .throwOnError();
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
    refunded: order.payment_status === 'refunded',
    trackingNumber: order.tracking_number,
    orderUrl: `${siteUrl()}/${orderPagePath(order.access_token)}`,
    pickupLocation: order.shipping_methods?.pickup_location ?? null,
    pickupHours: order.shipping_methods?.pickup_hours ?? null,
    items: order.order_items.map((item) => ({
      name: item.product_name,
      options: item.options as ProductOptions,
      quantity: item.quantity,
      lineTotalRappen: item.line_total_rappen,
    })),
  };
}

async function logEvent(supabase: AdminClient, orderId: string, kind: string, detail: string) {
  await supabase.rpc('log_order_event', { p_order_id: orderId, p_kind: kind, p_detail: detail });
}

export async function sendCustomerMail(
  supabase: AdminClient,
  orderId: string,
  kind: CustomerMailKind,
): Promise<boolean> {
  try {
    const order = await loadOrderMail(supabase, orderId);
    const content = customerTemplates[kind](order, siteUrl());
    await sendMail({ to: order.email, ...content }, mailSettingsFromEnv());
    await logEvent(supabase, orderId, 'mail_sent', content.subject);
    return true;
  } catch (error) {
    console.error('customer mail failed', error);
    await logEvent(supabase, orderId, 'mail_failed', `${kind}: ${String(error)}`);
    return false;
  }
}

export async function sendAdminNotification(supabase: AdminClient, orderId: string): Promise<void> {
  const recipients = envList('ADMIN_NOTIFICATION_TO');
  if (recipients.length === 0) {
    return;
  }
  try {
    const content = adminNewOrder(await loadOrderMail(supabase, orderId), siteUrl());
    const settings = mailSettingsFromEnv();
    await Promise.all(recipients.map((to) => sendMail({ to, ...content }, settings)));
  } catch (error) {
    console.error('admin notification failed', error);
    await logEvent(supabase, orderId, 'mail_failed', `admin: ${String(error)}`);
  }
}

import { inject, Injectable } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Supabase } from '../core/supabase';
import { Database } from '../../types/database.types';

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

export type PaymentStatus = Enums['payment_status'];
export type FulfillmentStatus = Enums['fulfillment_status'];
export type OrderAction = 'processing' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'cancel';

export type OrderListEntry = Pick<
  Tables['orders']['Row'],
  | 'id'
  | 'order_number'
  | 'created_at'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'total_rappen'
  | 'shipping_kind'
  | 'shipping_name'
  | 'payment_status'
  | 'fulfillment_status'
>;

export type OrderDetail = Tables['orders']['Row'] & {
  order_items: Tables['order_items']['Row'][];
  order_events: Tables['order_events']['Row'][];
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Zahlung offen',
  paid: 'Bezahlt',
  failed: 'Zahlung fehlgeschlagen',
  expired: 'Abgebrochen',
  refunded: 'Erstattet',
};

export const fulfillmentStatusLabels: Record<FulfillmentStatus, string> = {
  new: 'Neu',
  processing: 'In Arbeit',
  ready_for_pickup: 'Abholbereit',
  shipped: 'Versandt',
  delivered: 'Geliefert',
  cancelled: 'Storniert',
};

const paymentMethodLabels: Record<string, string> = {
  card: 'Karte',
  twint: 'TWINT',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  link: 'Link',
};

export function paymentMethodLabel(method: string | null): string {
  return method ? (paymentMethodLabels[method] ?? method) : '–';
}

export interface OrderFilter {
  view: 'open' | 'done' | 'all' | 'unpaid';
  search: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly supabase = inject(Supabase);

  async orders(filter: OrderFilter): Promise<OrderListEntry[]> {
    let query = this.supabase.client
      .from('orders')
      .select(
        'id, order_number, created_at, first_name, last_name, email, total_rappen, shipping_kind, shipping_name, payment_status, fulfillment_status',
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (filter.view === 'open') {
      query = query
        .eq('payment_status', 'paid')
        .in('fulfillment_status', ['new', 'processing', 'ready_for_pickup', 'shipped']);
    } else if (filter.view === 'done') {
      query = query.in('fulfillment_status', ['delivered', 'cancelled']);
    } else if (filter.view === 'unpaid') {
      query = query.in('payment_status', ['pending', 'failed', 'expired']);
    } else {
      query = query.in('payment_status', ['paid', 'refunded']);
    }
    const search = filter.search.trim();
    if (search) {
      const number = Number(search.replace('#', ''));
      query =
        Number.isInteger(number) && number > 0
          ? query.eq('order_number', number)
          : query.or(
              `last_name.ilike.%${search}%,first_name.ilike.%${search}%,email.ilike.%${search}%`,
            );
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data;
  }

  async order(id: string): Promise<OrderDetail | null> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*), order_events(*)')
      .eq('id', id)
      .order('created_at', { referencedTable: 'order_events', ascending: false })
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async updateOrder(
    orderId: string,
    action: OrderAction,
    options: { trackingNumber?: string; sendMail: boolean },
  ): Promise<{ refunded?: boolean; mailed?: boolean }> {
    const { data, error } = await this.supabase.client.functions.invoke<{
      refunded?: boolean;
      mailed?: boolean;
    }>('admin-update-order', {
      body: { orderId, action, trackingNumber: options.trackingNumber, sendMail: options.sendMail },
    });
    if (error) {
      let message = 'Die Bestellung konnte nicht aktualisiert werden.';
      if (error instanceof FunctionsHttpError) {
        const body = (await error.context.json().catch(() => ({}))) as { error?: string };
        message = body.error ?? message;
      }
      throw new Error(message);
    }
    return data ?? {};
  }
}

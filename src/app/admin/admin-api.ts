import { inject, Injectable } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type {
  FulfillmentStatus,
  OrderUpdateRequest,
  OrderUpdateResult,
  PaymentStatus,
  TableRow,
} from '../../../supabase/functions/_shared/orders';
import { Supabase } from '../core/supabase';
import { UserFacingError } from './user-facing-error';

export type OrderView = 'open' | 'done' | 'all' | 'unpaid';

export interface OrderFilter {
  view: OrderView;
  search: string;
}

export type OrderListEntry = Pick<
  TableRow<'orders'>,
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

export type OrderDetail = TableRow<'orders'> & {
  order_items: TableRow<'order_items'>[];
  order_events: TableRow<'order_events'>[];
};

const orderViews: Record<
  OrderView,
  { payment?: PaymentStatus[]; fulfillment?: FulfillmentStatus[] }
> = {
  open: { payment: ['paid', 'due'], fulfillment: ['new', 'processing', 'ready_for_pickup'] },
  done: { fulfillment: ['shipped', 'delivered', 'cancelled'] },
  all: { payment: ['paid', 'due', 'refunded'] },
  unpaid: { payment: ['pending', 'failed', 'expired'] },
};

function quotedPattern(search: string): string {
  return `"%${search.replace(/["\\]/g, '\\$&')}%"`;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly supabase = inject(Supabase);

  async orders(filter: OrderFilter): Promise<OrderListEntry[]> {
    const { payment, fulfillment } = orderViews[filter.view];
    let query = this.supabase.client
      .from('orders')
      .select(
        'id, order_number, created_at, first_name, last_name, email, total_rappen, shipping_kind, shipping_name, payment_status, fulfillment_status',
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (payment) {
      query = query.in('payment_status', payment);
    }
    if (fulfillment) {
      query = query.in('fulfillment_status', fulfillment);
    }
    const search = filter.search.trim();
    const orderNumber = Number(search.replace('#', ''));
    if (Number.isInteger(orderNumber) && orderNumber > 0) {
      query = query.eq('order_number', orderNumber);
    } else if (search) {
      const pattern = quotedPattern(search);
      query = query.or(
        `last_name.ilike.${pattern},first_name.ilike.${pattern},email.ilike.${pattern}`,
      );
    }
    const { data } = await query.throwOnError();
    return data;
  }

  async order(id: string): Promise<OrderDetail | null> {
    const { data } = await this.supabase.client
      .from('orders')
      .select('*, order_items(*), order_events(*)')
      .eq('id', id)
      .order('created_at', { referencedTable: 'order_events', ascending: false })
      .maybeSingle()
      .throwOnError();
    return data;
  }

  async updateOrder(request: OrderUpdateRequest): Promise<OrderUpdateResult> {
    const { data, error } = await this.supabase.client.functions.invoke<OrderUpdateResult>(
      'admin-update-order',
      { body: request },
    );
    if (error || !data) {
      const body: { error?: string } =
        error instanceof FunctionsHttpError ? await error.context.json().catch(() => ({})) : {};
      throw new UserFacingError(body.error ?? 'Die Bestellung konnte nicht aktualisiert werden.');
    }
    return data;
  }
}

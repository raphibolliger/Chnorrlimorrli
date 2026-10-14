import { inject, Injectable } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Supabase } from './supabase';

export interface CheckoutPayload {
  items: { productId: string; quantity: number; options: Record<string, string> }[];
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

export interface OrderSummary {
  order_number: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
  first_name: string;
  email: string;
  shipping_kind: 'pickup' | 'postal' | 'local_delivery';
  shipping_name: string;
  subtotal_rappen: number;
  shipping_rappen: number;
  total_rappen: number;
  order_items: {
    product_name: string;
    options: Record<string, string>;
    quantity: number;
    line_total_rappen: number;
  }[];
}

export class CheckoutError extends Error {
  constructor(readonly messages: string[]) {
    super(messages.join(' '));
  }
}

@Injectable({ providedIn: 'root' })
export class CheckoutApi {
  private readonly supabase = inject(Supabase);

  async startCheckout(payload: CheckoutPayload): Promise<string> {
    const { data, error } = await this.supabase.client.functions.invoke<{ url: string }>(
      'create-checkout',
      { body: payload },
    );
    if (error) {
      throw new CheckoutError(await this.errorMessages(error));
    }
    if (!data?.url) {
      throw new CheckoutError(['Die Zahlung konnte nicht gestartet werden.']);
    }
    return data.url;
  }

  async orderSummary(sessionId: string): Promise<OrderSummary | null> {
    const { data, error } = await this.supabase.client.functions.invoke<OrderSummary>(
      `order-summary?session_id=${encodeURIComponent(sessionId)}`,
      { method: 'GET' },
    );
    if (error) {
      if (error instanceof FunctionsHttpError && error.context.status === 404) {
        return null;
      }
      throw error;
    }
    return data;
  }

  private async errorMessages(error: unknown): Promise<string[]> {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = (await error.context.json()) as { errors?: string[] };
        if (body.errors?.length) {
          return body.errors;
        }
      } catch {
        return ['Die Zahlung konnte nicht gestartet werden. Bitte versuche es später noch einmal.'];
      }
    }
    return ['Die Zahlung konnte nicht gestartet werden. Bitte versuche es später noch einmal.'];
  }
}

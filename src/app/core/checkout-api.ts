import { inject, Injectable } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { CheckoutRequest, OrderSummary } from '../../../supabase/functions/_shared/orders';
import { Supabase } from './supabase';

export const checkoutFailed =
  'Die Zahlung konnte nicht gestartet werden. Bitte versuche es später noch einmal.';

export class CheckoutError extends Error {
  constructor(readonly messages: string[]) {
    super(messages.join(' '));
  }
}

async function errorMessages(error: unknown): Promise<string[]> {
  if (error instanceof FunctionsHttpError) {
    const body: { errors?: string[] } = await error.context.json().catch(() => ({}));
    if (body.errors?.length) {
      return body.errors;
    }
  }
  return [checkoutFailed];
}

@Injectable({ providedIn: 'root' })
export class CheckoutApi {
  private readonly supabase = inject(Supabase);

  async startCheckout(request: CheckoutRequest): Promise<string> {
    const { data, error } = await this.supabase.client.functions.invoke<{ url: string }>(
      'create-checkout',
      { body: request },
    );
    if (error) {
      throw new CheckoutError(await errorMessages(error));
    }
    if (!data?.url) {
      throw new CheckoutError([checkoutFailed]);
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
}

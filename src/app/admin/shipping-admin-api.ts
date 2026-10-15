import { inject, Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';
import { ShippingMethod } from '../core/shop-api';

export interface ShippingDraft {
  name: string;
  description: string;
  active: boolean;
  sort_order: number;
  postal_codes: string[];
  pickup_location: string;
  pickup_hours: string;
  rates: { from_subtotal_rappen: number; price_rappen: number }[];
}

export function parsePostalCodes(value: string): string[] {
  return [...new Set(value.split(/[\s,;]+/).filter((code) => /^\d{4}$/.test(code)))].sort();
}

@Injectable({ providedIn: 'root' })
export class ShippingAdminApi {
  private readonly supabase = inject(Supabase);

  async methods(): Promise<ShippingMethod[]> {
    const { data } = await this.supabase.client
      .from('shipping_methods')
      .select('*, shipping_rates(*)')
      .order('sort_order')
      .order('from_subtotal_rappen', { referencedTable: 'shipping_rates' })
      .throwOnError();
    return data;
  }

  async save(id: string, draft: ShippingDraft): Promise<void> {
    await this.supabase.client
      .rpc('save_shipping_method', {
        p_id: id,
        p_method: {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          active: draft.active,
          sort_order: draft.sort_order,
          postal_codes: draft.postal_codes,
          pickup_location: draft.pickup_location.trim() || null,
          pickup_hours: draft.pickup_hours.trim() || null,
        },
        p_rates: [
          ...new Map(draft.rates.map((rate) => [rate.from_subtotal_rappen, rate])).values(),
        ],
      })
      .throwOnError();
  }
}

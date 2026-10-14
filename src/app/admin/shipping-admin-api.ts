import { inject, Injectable } from '@angular/core';
import { Database } from '../../types/database.types';
import { Supabase } from '../core/supabase';

type Tables = Database['public']['Tables'];

export type AdminShippingMethod = Tables['shipping_methods']['Row'] & {
  shipping_rates: Tables['shipping_rates']['Row'][];
};

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

  async methods(): Promise<AdminShippingMethod[]> {
    const { data, error } = await this.supabase.client
      .from('shipping_methods')
      .select('*, shipping_rates(*)')
      .order('sort_order')
      .order('from_subtotal_rappen', { referencedTable: 'shipping_rates' });
    if (error) throw error;
    return data;
  }

  async save(id: string, draft: ShippingDraft): Promise<void> {
    const { error } = await this.supabase.client
      .from('shipping_methods')
      .update({
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        active: draft.active,
        sort_order: draft.sort_order,
        postal_codes: draft.postal_codes,
        pickup_location: draft.pickup_location.trim() || null,
        pickup_hours: draft.pickup_hours.trim() || null,
      })
      .eq('id', id);
    if (error) throw error;
    const { error: deleteError } = await this.supabase.client
      .from('shipping_rates')
      .delete()
      .eq('shipping_method_id', id);
    if (deleteError) throw deleteError;
    const rates = [
      ...new Map(draft.rates.map((rate) => [rate.from_subtotal_rappen, rate])).values(),
    ];
    const { error: insertError } = await this.supabase.client
      .from('shipping_rates')
      .insert(rates.map((rate) => ({ ...rate, shipping_method_id: id })));
    if (insertError) throw insertError;
  }
}

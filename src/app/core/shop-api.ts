import { inject, Injectable } from '@angular/core';
import { Database } from '../../types/database.types';
import { Supabase } from './supabase';

type Tables = Database['public']['Tables'];

export type ShippingMethod = Tables['shipping_methods']['Row'] & {
  shipping_rates: Tables['shipping_rates']['Row'][];
};

@Injectable({ providedIn: 'root' })
export class ShopApi {
  private readonly supabase = inject(Supabase);

  async shippingMethods(): Promise<ShippingMethod[]> {
    const { data, error } = await this.supabase.client
      .from('shipping_methods')
      .select('*, shipping_rates(*)')
      .eq('active', true)
      .order('sort_order');
    if (error) {
      throw error;
    }
    return data.map((method) => ({
      ...method,
      shipping_rates: [...method.shipping_rates].sort(
        (a, b) => a.from_subtotal_rappen - b.from_subtotal_rappen,
      ),
    }));
  }
}

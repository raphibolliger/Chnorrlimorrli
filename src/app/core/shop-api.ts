import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Database } from '../../types/database.types';
import { Supabase } from './supabase';

type Tables = Database['public']['Tables'];

export type ShippingMethod = Tables['shipping_methods']['Row'] & {
  shipping_rates: Tables['shipping_rates']['Row'][];
};

export type ProductImage = Pick<Tables['product_images']['Row'], 'id' | 'storage_path' | 'alt'>;
export type ProductOption = Pick<Tables['product_options']['Row'], 'id' | 'name' | 'choices'>;

export type Product = Tables['products']['Row'] & {
  product_images: ProductImage[];
  product_options: ProductOption[];
};

const productSelection =
  '*, product_images(id, storage_path, alt, sort_order), product_options(id, name, choices, sort_order)';

export function productImageUrl(storagePath: string): string {
  return `${environment.supabaseUrl}/storage/v1/object/public/product-images/${storagePath}`;
}

export function isSoldOut(product: Pick<Product, 'track_stock' | 'stock'>): boolean {
  return product.track_stock && (product.stock ?? 0) <= 0;
}

export function maxOrderQuantity(product: Pick<Product, 'track_stock' | 'stock'>): number {
  return product.track_stock ? Math.min(product.stock ?? 0, 20) : 20;
}

@Injectable({ providedIn: 'root' })
export class ShopApi {
  private readonly supabase = inject(Supabase);

  async products(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(productSelection)
      .eq('active', true)
      .order('sort_order')
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' });
    if (error) {
      throw error;
    }
    return data;
  }

  async product(slug: string): Promise<Product | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(productSelection)
      .eq('slug', slug)
      .eq('active', true)
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' })
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async productsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }
    const { data, error } = await this.supabase.client
      .from('products')
      .select(productSelection)
      .in('id', ids);
    if (error) {
      throw error;
    }
    return data;
  }

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

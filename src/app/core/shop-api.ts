import { inject, Injectable } from '@angular/core';
import type { TableRow } from '../../../supabase/functions/_shared/orders';
import { maxLineQuantity } from '../../../supabase/functions/_shared/pricing';
import { environment } from '../../environments/environment';
import { Supabase } from './supabase';

export type ShippingMethod = TableRow<'shipping_methods'> & {
  shipping_rates: TableRow<'shipping_rates'>[];
};

export type ProductImage = Pick<TableRow<'product_images'>, 'id' | 'storage_path' | 'alt'>;
export type ProductOption = Pick<TableRow<'product_options'>, 'id' | 'name' | 'choices'>;

export type Product = TableRow<'products'> & {
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
  return product.track_stock ? Math.min(product.stock ?? 0, maxLineQuantity) : maxLineQuantity;
}

@Injectable({ providedIn: 'root' })
export class ShopApi {
  private readonly supabase = inject(Supabase);

  async products(): Promise<Product[]> {
    const { data } = await this.supabase.client
      .from('products')
      .select(productSelection)
      .eq('active', true)
      .order('sort_order')
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' })
      .throwOnError();
    return data;
  }

  async product(slug: string): Promise<Product | null> {
    const { data } = await this.supabase.client
      .from('products')
      .select(productSelection)
      .eq('slug', slug)
      .eq('active', true)
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' })
      .maybeSingle()
      .throwOnError();
    return data;
  }

  async productsByIds(ids: string[]): Promise<Product[]> {
    const { data } = await this.supabase.client
      .from('products')
      .select(productSelection)
      .in('id', ids)
      .throwOnError();
    return data;
  }

  async shippingMethods(): Promise<ShippingMethod[]> {
    const { data } = await this.supabase.client
      .from('shipping_methods')
      .select('*, shipping_rates(*)')
      .eq('active', true)
      .order('sort_order')
      .order('from_subtotal_rappen', { referencedTable: 'shipping_rates' })
      .throwOnError();
    return data;
  }
}

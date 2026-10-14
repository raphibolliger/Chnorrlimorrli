import { inject, Injectable } from '@angular/core';
import { Database } from '../../types/database.types';
import { Supabase } from '../core/supabase';

type Tables = Database['public']['Tables'];

export type AdminProduct = Tables['products']['Row'] & {
  product_images: Tables['product_images']['Row'][];
  product_options: Tables['product_options']['Row'][];
};

export interface ProductDraft {
  name: string;
  slug: string;
  sku: string;
  price_rappen: number;
  short_description: string;
  description: string;
  active: boolean;
  sort_order: number;
  track_stock: boolean;
  stock: number | null;
  options: { name: string; choices: string[] }[];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function resizeToWebp(file: File, maxSize = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht umgewandelt werden.'))),
      'image/webp',
      0.82,
    ),
  );
}

@Injectable({ providedIn: 'root' })
export class ProductAdminApi {
  private readonly supabase = inject(Supabase);

  async products(): Promise<AdminProduct[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*, product_images(*), product_options(*)')
      .order('sort_order')
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' });
    if (error) throw error;
    return data;
  }

  async product(id: string): Promise<AdminProduct | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*, product_images(*), product_options(*)')
      .eq('id', id)
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' })
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async save(id: string | null, draft: ProductDraft): Promise<string> {
    const row = {
      name: draft.name.trim(),
      slug: draft.slug,
      sku: draft.sku.trim() || null,
      price_rappen: draft.price_rappen,
      short_description: draft.short_description.trim() || null,
      description: draft.description.trim() || null,
      active: draft.active,
      sort_order: draft.sort_order,
      track_stock: draft.track_stock,
      stock: draft.track_stock ? (draft.stock ?? 0) : null,
    };
    const { data, error } = id
      ? await this.supabase.client.from('products').update(row).eq('id', id).select('id').single()
      : await this.supabase.client.from('products').insert(row).select('id').single();
    if (error) {
      throw new Error(
        error.code === '23505'
          ? 'Das URL-Kürzel ist bereits vergeben.'
          : 'Das Produkt konnte nicht gespeichert werden.',
      );
    }
    await this.replaceOptions(data.id, draft.options);
    return data.id;
  }

  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase.client.from('products').update({ active }).eq('id', id);
    if (error) throw error;
  }

  async remove(product: AdminProduct): Promise<void> {
    const paths = product.product_images
      .map((image) => image.storage_path)
      .filter((path) => !path.startsWith('seed/'));
    if (paths.length > 0) {
      await this.supabase.client.storage.from('product-images').remove(paths);
    }
    const { error } = await this.supabase.client.from('products').delete().eq('id', product.id);
    if (error) throw error;
  }

  async uploadImage(productId: string, file: File, alt: string, sortOrder: number): Promise<void> {
    const blob = await resizeToWebp(file);
    const path = `products/${productId}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await this.supabase.client.storage
      .from('product-images')
      .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
    if (uploadError) throw uploadError;
    const { error } = await this.supabase.client.from('product_images').insert({
      product_id: productId,
      storage_path: path,
      alt: alt || null,
      sort_order: sortOrder,
    });
    if (error) throw error;
  }

  async updateImage(
    id: string,
    changes: { alt?: string | null; sort_order?: number },
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('product_images')
      .update(changes)
      .eq('id', id);
    if (error) throw error;
  }

  async removeImage(id: string, storagePath: string): Promise<void> {
    const { error } = await this.supabase.client.from('product_images').delete().eq('id', id);
    if (error) throw error;
    if (!storagePath.startsWith('seed/')) {
      await this.supabase.client.storage.from('product-images').remove([storagePath]);
    }
  }

  private async replaceOptions(productId: string, options: ProductDraft['options']): Promise<void> {
    const { error: deleteError } = await this.supabase.client
      .from('product_options')
      .delete()
      .eq('product_id', productId);
    if (deleteError) throw deleteError;
    const rows = options
      .map((option, index) => ({
        product_id: productId,
        name: option.name.trim(),
        choices: option.choices.map((choice) => choice.trim()).filter(Boolean),
        sort_order: index,
      }))
      .filter((option) => option.name && option.choices.length > 0);
    if (rows.length > 0) {
      const { error } = await this.supabase.client.from('product_options').insert(rows);
      if (error) throw error;
    }
  }
}

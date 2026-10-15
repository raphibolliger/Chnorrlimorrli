import { inject, Injectable } from '@angular/core';
import type { TableRow } from '../../../supabase/functions/_shared/orders';
import { Supabase } from '../core/supabase';
import { UserFacingError } from './user-facing-error';

export type AdminProduct = TableRow<'products'> & {
  product_images: TableRow<'product_images'>[];
  product_options: TableRow<'product_options'>[];
};

const bucket = 'product-images';

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

function isSeedImage(path: string): boolean {
  return path.startsWith('seed/');
}

@Injectable({ providedIn: 'root' })
export class ProductAdminApi {
  private readonly supabase = inject(Supabase);

  async products(): Promise<AdminProduct[]> {
    const { data } = await this.supabase.client
      .from('products')
      .select('*, product_images(*), product_options(*)')
      .order('sort_order')
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' })
      .throwOnError();
    return data;
  }

  async product(id: string): Promise<AdminProduct | null> {
    const { data } = await this.supabase.client
      .from('products')
      .select('*, product_images(*), product_options(*)')
      .eq('id', id)
      .order('sort_order', { referencedTable: 'product_images' })
      .order('sort_order', { referencedTable: 'product_options' })
      .maybeSingle()
      .throwOnError();
    return data;
  }

  async save(id: string | null, draft: ProductDraft): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('save_product', {
      p_id: id ?? undefined,
      p_product: {
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
      },
      p_options: draft.options
        .map((option) => ({
          name: option.name.trim(),
          choices: option.choices.map((choice) => choice.trim()).filter(Boolean),
        }))
        .filter((option) => option.name && option.choices.length > 0),
    });
    if (error) {
      throw new UserFacingError(
        error.code === '23505'
          ? 'Das URL-Kürzel ist bereits vergeben.'
          : 'Das Produkt konnte nicht gespeichert werden.',
      );
    }
    return data;
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await this.supabase.client.from('products').update({ active }).eq('id', id).throwOnError();
  }

  async remove(product: AdminProduct): Promise<void> {
    await this.supabase.client.from('products').delete().eq('id', product.id).throwOnError();
    await this.removeFiles(product.product_images.map((image) => image.storage_path));
  }

  async uploadImage(productId: string, file: File, alt: string, sortOrder: number): Promise<void> {
    const blob = await resizeToWebp(file);
    const path = `products/${productId}/${crypto.randomUUID()}.webp`;
    const { error } = await this.supabase.client.storage
      .from(bucket)
      .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
    if (error) throw error;
    await this.supabase.client
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: path,
        alt: alt || null,
        sort_order: sortOrder,
      })
      .throwOnError();
  }

  async updateImage(
    id: string,
    changes: { alt?: string | null; sort_order?: number },
  ): Promise<void> {
    await this.supabase.client.from('product_images').update(changes).eq('id', id).throwOnError();
  }

  async removeImage(id: string, storagePath: string): Promise<void> {
    await this.supabase.client.from('product_images').delete().eq('id', id).throwOnError();
    await this.removeFiles([storagePath]);
  }

  private async removeFiles(paths: string[]): Promise<void> {
    const uploaded = paths.filter((path) => !isSeedImage(path));
    if (uploaded.length > 0) {
      await this.supabase.client.storage.from(bucket).remove(uploaded);
    }
  }
}

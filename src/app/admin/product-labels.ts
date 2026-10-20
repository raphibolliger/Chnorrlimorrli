import { AdminProduct } from './product-admin-api';
import { Chip } from './ui/tones';

const visibleChip: Chip = { label: 'Sichtbar', icon: 'check', tone: 'success' };
const hiddenChip: Chip = { label: 'Ausgeblendet', icon: 'close', tone: 'neutral' };

export function visibilityChip(product: Pick<AdminProduct, 'active'>): Chip {
  return product.active ? visibleChip : hiddenChip;
}

export function stockLabel(product: Pick<AdminProduct, 'track_stock' | 'stock'>): string {
  return product.track_stock ? `${product.stock ?? 0} Stk.` : 'unbegrenzt';
}

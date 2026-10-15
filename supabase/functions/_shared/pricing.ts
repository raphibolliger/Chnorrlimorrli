export interface ShippingRate {
  from_subtotal_rappen: number;
  price_rappen: number;
}

export interface CartLine {
  unitPriceRappen: number;
  quantity: number;
}

export const maxLineQuantity = 20;

export function subtotalRappen(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPriceRappen * line.quantity, 0);
}

export function shippingPriceRappen(rates: ShippingRate[], subtotal: number): number {
  const applicable = [...rates]
    .sort((a, b) => b.from_subtotal_rappen - a.from_subtotal_rappen)
    .find((rate) => rate.from_subtotal_rappen <= subtotal);
  return applicable?.price_rappen ?? 0;
}

export function normalizePostalCode(postalCode: string): string {
  return postalCode.replace(/\s+/g, '');
}

export function isSwissPostalCode(postalCode: string): boolean {
  return /^[1-9]\d{3}$/.test(normalizePostalCode(postalCode));
}

export function deliversTo(postalCodes: string[], postalCode: string): boolean {
  return postalCodes.includes(normalizePostalCode(postalCode));
}

export function formatChf(rappen: number): string {
  const francs = Math.floor(rappen / 100);
  const cents = String(rappen % 100).padStart(2, '0');
  return `CHF ${francs}.${cents}`;
}

export function formatShippingPrice(rappen: number): string {
  return rappen === 0 ? 'kostenlos' : formatChf(rappen);
}

import {
  deliversTo,
  formatChf,
  isSwissPostalCode,
  shippingPriceRappen,
  subtotalRappen,
} from '../../../supabase/functions/_shared/pricing';

const postalRates = [
  { from_subtotal_rappen: 0, price_rappen: 0 },
  { from_subtotal_rappen: 1001, price_rappen: 1000 },
];

describe('pricing', () => {
  it('sums cart lines', () => {
    expect(
      subtotalRappen([
        { unitPriceRappen: 4000, quantity: 2 },
        { unitPriceRappen: 1000, quantity: 1 },
      ]),
    ).toBe(9000);
  });

  it('ships socks alone for free like in Ecwid', () => {
    expect(shippingPriceRappen(postalRates, 1000)).toBe(0);
  });

  it('charges postal shipping above CHF 10', () => {
    expect(shippingPriceRappen(postalRates, 1005)).toBe(1000);
    expect(shippingPriceRappen(postalRates, 4000)).toBe(1000);
  });

  it('falls back to free shipping without rates', () => {
    expect(shippingPriceRappen([], 4000)).toBe(0);
  });

  it('validates Swiss postal codes', () => {
    expect(isSwissPostalCode('5612')).toBe(true);
    expect(isSwissPostalCode(' 56 12 ')).toBe(true);
    expect(isSwissPostalCode('0612')).toBe(false);
    expect(isSwissPostalCode('561')).toBe(false);
  });

  it('checks local delivery postal codes', () => {
    expect(deliversTo(['5612', '5610'], '5610')).toBe(true);
    expect(deliversTo(['5612', '5610'], '8000')).toBe(false);
  });

  it('formats Swiss francs', () => {
    expect(formatChf(4000)).toBe('CHF 40.00');
    expect(formatChf(505)).toBe('CHF 5.05');
  });
});

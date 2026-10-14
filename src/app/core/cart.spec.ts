import { TestBed } from '@angular/core/testing';
import { Cart, CartItem, cartItemKey } from './cart';

const socks: CartItem = {
  productId: 'socks',
  slug: 'chnorrlimorrli-socken',
  name: 'Chnorrlimorrli-Socken',
  unitPriceRappen: 1000,
  imagePath: null,
  options: { Grösse: '31-35' },
  quantity: 1,
};

describe('Cart', () => {
  let cart: Cart;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(Cart);
  });

  it('merges identical products with the same options', () => {
    cart.add(socks, 20);
    cart.add({ ...socks, quantity: 2 }, 20);
    expect(cart.items().length).toBe(1);
    expect(cart.count()).toBe(3);
    expect(cart.subtotalRappen()).toBe(3000);
  });

  it('keeps different options as separate lines', () => {
    cart.add(socks, 20);
    cart.add({ ...socks, options: { Grösse: '39-46' } }, 20);
    expect(cart.items().length).toBe(2);
  });

  it('caps quantities at the available stock', () => {
    cart.add({ ...socks, quantity: 5 }, 3);
    cart.add({ ...socks, quantity: 5 }, 3);
    expect(cart.count()).toBe(3);
  });

  it('removes lines when the quantity drops to zero', () => {
    cart.add(socks, 20);
    cart.setQuantity(cartItemKey(socks), 0);
    expect(cart.items()).toEqual([]);
  });

  it('builds stable keys regardless of option order', () => {
    expect(cartItemKey({ productId: 'a', options: { b: '2', a: '1' } })).toBe(
      cartItemKey({ productId: 'a', options: { a: '1', b: '2' } }),
    );
  });
});

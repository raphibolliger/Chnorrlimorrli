import { orderProgress, statusHeadline } from './order-progress';

describe('orderProgress', () => {
  it('ends the postal flow with the shipment', () => {
    expect(
      orderProgress({ order_number: 1001, shipping_kind: 'postal', fulfillment_status: 'shipped' }),
    ).toEqual([
      { label: 'Bestellt', state: 'done' },
      { label: 'In Arbeit', state: 'done' },
      { label: 'Versandt', state: 'current' },
    ]);
  });

  it('shows earlier postal orders marked as delivered as complete', () => {
    expect(
      orderProgress({
        order_number: 1001,
        shipping_kind: 'postal',
        fulfillment_status: 'delivered',
      }).map((step) => step.state),
    ).toEqual(['done', 'done', 'current']);
  });

  it('names pickup steps and marks skipped steps as done', () => {
    expect(
      orderProgress({
        order_number: 1001,
        shipping_kind: 'pickup',
        fulfillment_status: 'ready_for_pickup',
      }).map((step) => `${step.label}:${step.state}`),
    ).toEqual(['Bestellt:done', 'In Arbeit:done', 'Abholbereit:current', 'Abgeholt:upcoming']);
  });

  it('has no shipping step for local delivery', () => {
    expect(
      orderProgress({
        order_number: 1001,
        shipping_kind: 'local_delivery',
        fulfillment_status: 'new',
      }).map((step) => step.label),
    ).toEqual(['Bestellt', 'In Arbeit', 'Geliefert']);
  });
});

describe('statusHeadline', () => {
  it('describes the current status', () => {
    expect(
      statusHeadline({ order_number: 1001, shipping_kind: 'postal', fulfillment_status: 'new' }),
    ).toBe('Deine Bestellung 1001 ist bei uns.');
    expect(
      statusHeadline({
        order_number: 1001,
        shipping_kind: 'pickup',
        fulfillment_status: 'delivered',
      }),
    ).toBe('Deine Bestellung wurde abgeholt.');
  });
});

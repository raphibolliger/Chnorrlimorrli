import {
  FulfillmentAction,
  fulfillmentFlow,
  fulfillmentStepLabel,
  OrderSummary,
} from '../../../supabase/functions/_shared/orders';

export type StepState = 'done' | 'current' | 'upcoming';

export interface ProgressStep {
  label: string;
  state: StepState;
}

type OrderState = Pick<OrderSummary, 'order_number' | 'shipping_kind' | 'fulfillment_status'>;

export function orderProgress(order: OrderState): ProgressStep[] {
  const steps: ('new' | FulfillmentAction)[] = ['new', ...fulfillmentFlow[order.shipping_kind]];
  const reached = steps.findIndex((step) => step === order.fulfillment_status);
  const current =
    reached >= 0 ? reached : order.fulfillment_status === 'delivered' ? steps.length - 1 : 0;
  return steps.map((step, index) => ({
    label: step === 'new' ? 'Bestellt' : fulfillmentStepLabel(step, order.shipping_kind),
    state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
  }));
}

export function statusHeadline(order: OrderState): string {
  switch (order.fulfillment_status) {
    case 'new':
      return `Deine Bestellung ${order.order_number} ist bei uns.`;
    case 'processing':
      return 'Wir bereiten deine Bestellung vor.';
    case 'ready_for_pickup':
      return 'Deine Bestellung liegt zur Abholung bereit.';
    case 'shipped':
      return 'Deine Bestellung ist unterwegs.';
    case 'delivered':
      return order.shipping_kind === 'pickup'
        ? 'Deine Bestellung wurde abgeholt.'
        : 'Deine Bestellung wurde geliefert.';
    case 'cancelled':
      return 'Deine Bestellung wurde storniert.';
  }
}

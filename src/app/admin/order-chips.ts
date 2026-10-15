import { FulfillmentStatus, PaymentStatus } from './admin-api';
import { Chip } from './ui/tones';

const paymentChips: Record<PaymentStatus, Chip> = {
  pending: { label: 'Zahlung offen', icon: 'clock', tone: 'warning' },
  paid: { label: 'Bezahlt', icon: 'check', tone: 'success' },
  failed: { label: 'Zahlung fehlgeschlagen', icon: 'close', tone: 'danger' },
  expired: { label: 'Abgebrochen', icon: 'close', tone: 'neutral' },
  refunded: { label: 'Erstattet', icon: 'undo', tone: 'info' },
};

const fulfillmentChips: Record<FulfillmentStatus, Chip> = {
  new: { label: 'Neu', icon: 'tag', tone: 'info' },
  processing: { label: 'In Arbeit', icon: 'box', tone: 'warning' },
  ready_for_pickup: { label: 'Abholbereit', icon: 'store', tone: 'info' },
  shipped: { label: 'Versandt', icon: 'shipping', tone: 'info' },
  delivered: { label: 'Geliefert', icon: 'check', tone: 'success' },
  cancelled: { label: 'Storniert', icon: 'close', tone: 'neutral' },
};

export function paymentChip(status: PaymentStatus): Chip {
  return paymentChips[status];
}

export function fulfillmentChip(status: FulfillmentStatus): Chip {
  return fulfillmentChips[status];
}

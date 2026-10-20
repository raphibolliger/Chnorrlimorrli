import type { ShippingKind } from '../../../supabase/functions/_shared/orders';
import { IconName } from './ui/tones';

export const shippingKinds: Record<ShippingKind, { label: string; icon: IconName }> = {
  pickup: { label: 'Abholung', icon: 'store' },
  postal: { label: 'Postversand', icon: 'mail' },
  local_delivery: { label: 'Lokale Lieferung', icon: 'shipping' },
};

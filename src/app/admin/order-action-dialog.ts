import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  fulfillmentStepLabel,
  OrderAction,
  sendsCustomerMail,
} from '../../../supabase/functions/_shared/orders';
import { formatChf } from '../../../supabase/functions/_shared/pricing';
import { AdminApi, OrderDetail } from './admin-api';
import { AdminDialog } from './ui/dialog';
import { Icon } from './ui/icon';
import { failure, Notice, NoticeBanner } from './ui/notice-banner';

function cancellationText(order: OrderDetail): string {
  switch (order.payment_status) {
    case 'paid':
      return `Die Bestellung wird storniert und ${formatChf(order.total_rappen)} werden über Stripe zurückerstattet. Der Lagerbestand wird wieder erhöht.`;
    case 'refunded':
      return 'Die Bestellung wird storniert. Der Betrag wurde bereits über Stripe erstattet. Der Lagerbestand wird wieder erhöht.';
    case 'due':
      return 'Die Bestellung wird storniert. Es wurde nichts bezahlt (Barzahlung bei Abholung). Der Lagerbestand wird wieder erhöht.';
    default:
      return 'Die Bestellung wird storniert. Es wurde nichts bezahlt.';
  }
}

@Component({
  selector: 'app-order-action-dialog',
  imports: [FormsModule, AdminDialog, Icon, NoticeBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-action-dialog.html',
})
export class OrderActionDialog {
  readonly order = input.required<OrderDetail>();
  readonly action = input.required<OrderAction>();
  readonly done = output<string>();
  readonly dismissed = output();

  private readonly api = inject(AdminApi);

  protected readonly trackingNumber = linkedSignal(() => this.order().tracking_number ?? '');
  protected readonly notifyCustomer = signal(true);
  protected readonly busy = signal(false);
  protected readonly notice = signal<Notice | null>(null);

  protected readonly cancelling = computed(() => this.action() === 'cancel');
  protected readonly title = computed(() => {
    const action = this.action();
    return action === 'cancel'
      ? 'Bestellung stornieren'
      : `Status auf «${fulfillmentStepLabel(action, this.order().shipping_kind)}» setzen`;
  });
  protected readonly description = computed(() => {
    const action = this.action();
    const order = this.order();
    if (action === 'cancel') {
      return cancellationText(order);
    }
    const marked = `Die Bestellung wird als «${fulfillmentStepLabel(action, order.shipping_kind)}» markiert`;
    return action === 'delivered' && order.payment_status === 'due'
      ? `${marked} und ${formatChf(order.total_rappen)} werden als bar bezahlt verbucht.`
      : `${marked}.`;
  });
  protected readonly mailsCustomer = computed(() => sendsCustomerMail(this.action(), this.order()));
  protected readonly dirty = computed(
    () => this.trackingNumber() !== (this.order().tracking_number ?? ''),
  );

  protected async confirm(): Promise<void> {
    const action = this.action();
    this.busy.set(true);
    this.notice.set(null);
    try {
      const result = await this.api.updateOrder({
        orderId: this.order().id,
        action,
        trackingNumber: action === 'shipped' ? this.trackingNumber() : '',
        sendMail: this.mailsCustomer() && this.notifyCustomer(),
      });
      const parts = [action === 'cancel' ? 'Bestellung storniert.' : 'Status gespeichert.'];
      if (result.refunded) parts.push('Betrag über Stripe erstattet.');
      if (result.mailed) parts.push('Mail an die Kundin oder den Kunden gesendet.');
      this.done.emit(parts.join(' '));
    } catch (error) {
      this.notice.set(failure(error, 'Die Bestellung konnte nicht aktualisiert werden.'));
    } finally {
      this.busy.set(false);
    }
  }
}

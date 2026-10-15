import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChfPipe } from '../core/chf.pipe';
import { AdminApi, OrderFilter, OrderListEntry } from './admin-api';
import { fulfillmentChip, paymentChip } from './order-chips';
import { EmptyState } from './ui/empty-state';
import { ListSkeleton } from './ui/list-skeleton';
import { AdminPageHeader } from './ui/page-header';
import { SearchField } from './ui/search-field';
import { SegmentedControl, SegmentOption } from './ui/segmented-control';
import { StatusChip } from './ui/status-chip';

@Component({
  selector: 'app-admin-orders',
  imports: [
    DatePipe,
    RouterLink,
    ChfPipe,
    EmptyState,
    ListSkeleton,
    AdminPageHeader,
    SearchField,
    SegmentedControl,
    StatusChip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders.html',
})
export class AdminOrders {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);

  protected readonly views: SegmentOption<OrderFilter['view']>[] = [
    { value: 'open', label: 'Offen' },
    { value: 'done', label: 'Erledigt' },
    { value: 'all', label: 'Alle' },
    { value: 'unpaid', label: 'Nicht bezahlt' },
  ];
  protected readonly view = signal<OrderFilter['view']>('open');
  protected readonly search = signal('');
  protected readonly paymentChip = paymentChip;
  protected readonly fulfillmentChip = fulfillmentChip;

  protected readonly orders = resource({
    params: () => ({ view: this.view(), search: this.search() }),
    loader: ({ params }) => this.api.orders(params),
  });

  protected showFulfillment(order: OrderListEntry): boolean {
    return order.payment_status === 'paid' || order.fulfillment_status === 'cancelled';
  }

  protected open(order: OrderListEntry): void {
    this.router.navigate(['/admin/bestellungen', order.id]);
  }
}

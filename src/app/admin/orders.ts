import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChfPipe } from '../core/chf.pipe';
import { AdminApi, OrderFilter } from './admin-api';
import { StatusBadge } from './status-badge';

@Component({
  selector: 'app-admin-orders',
  imports: [DatePipe, RouterLink, ChfPipe, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders.html',
})
export class AdminOrders {
  private readonly api = inject(AdminApi);

  protected readonly views: { value: OrderFilter['view']; label: string }[] = [
    { value: 'open', label: 'Offen' },
    { value: 'done', label: 'Erledigt' },
    { value: 'all', label: 'Alle bezahlten' },
    { value: 'unpaid', label: 'Nicht bezahlt' },
  ];
  protected readonly view = signal<OrderFilter['view']>('open');
  protected readonly search = signal('');

  protected readonly orders = resource({
    params: () => ({ view: this.view(), search: this.search() }),
    loader: ({ params }) => this.api.orders(params),
  });
}

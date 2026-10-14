import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders.html',
})
export class AdminOrders {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.html',
})
export class AdminProducts {}

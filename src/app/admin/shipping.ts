import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { ShippingAdminApi } from './shipping-admin-api';
import { ShippingMethodForm } from './shipping-method-form';
import { ListSkeleton } from './ui/list-skeleton';
import { AdminPageHeader } from './ui/page-header';

@Component({
  selector: 'app-admin-shipping',
  imports: [ShippingMethodForm, ListSkeleton, AdminPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping.html',
})
export class AdminShipping {
  private readonly api = inject(ShippingAdminApi);

  protected readonly methods = resource({ loader: () => this.api.methods() });
}

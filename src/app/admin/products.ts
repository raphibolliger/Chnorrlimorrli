import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductImage } from '../components/product-image';
import { ChfPipe } from '../core/chf.pipe';
import { AdminProduct, ProductAdminApi } from './product-admin-api';

@Component({
  selector: 'app-admin-products',
  imports: [RouterLink, ProductImage, ChfPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.html',
})
export class AdminProducts {
  private readonly api = inject(ProductAdminApi);

  protected readonly products = resource({ loader: () => this.api.products() });

  protected async toggleActive(product: AdminProduct): Promise<void> {
    await this.api.setActive(product.id, !product.active);
    this.products.reload();
  }
}

import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageIntro } from '../components/page-intro';
import { ProductImage } from '../components/product-image';
import { ChfPipe } from '../core/chf.pipe';
import { isSoldOut, ShopApi } from '../core/shop-api';

@Component({
  selector: 'app-shop',
  imports: [RouterLink, PageIntro, ProductImage, ChfPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop.html',
})
export class Shop {
  private readonly shopApi = inject(ShopApi);

  protected readonly products = resource({ loader: () => this.shopApi.products() });
  protected readonly isSoldOut = isSoldOut;
}

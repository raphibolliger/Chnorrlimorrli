import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { productImageUrl } from '../core/shop-api';

@Component({
  selector: 'app-product-image',
  imports: [NgOptimizedImage],
  providers: [
    { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => productImageUrl(config.src) },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-image.html',
})
export class ProductImage {
  readonly path = input.required<string>();
  readonly alt = input('');
  readonly priority = input(false);
  readonly imageClass = input('object-contain');
}

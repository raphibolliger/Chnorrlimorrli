import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { siteImages } from '../content/images';

export function siteImageUrl(config: ImageLoaderConfig): string {
  const image = siteImages[config.src];
  const width = config.width ?? image.widths[image.widths.length - 1];
  return `images/${config.src}-${width}.webp`;
}

@Component({
  selector: 'app-site-image',
  imports: [NgOptimizedImage],
  providers: [{ provide: IMAGE_LOADER, useValue: siteImageUrl }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-image.html',
})
export class SiteImage {
  readonly name = input.required<string>();
  readonly alt = input.required<string>();
  readonly sizes = input('100vw');
  readonly priority = input(false);
  readonly fill = input(false);
  readonly imageClass = input('');

  protected readonly image = computed(() => siteImages[this.name()]);
  protected readonly srcset = computed(() =>
    this.image()
      .widths.map((width) => `${width}w`)
      .join(', '),
  );
}

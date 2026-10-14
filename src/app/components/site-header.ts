import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { mainNavigation } from '../content/navigation';
import { Cart } from '../core/cart';
import { SiteImage } from './site-image';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, SiteImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-header.html',
})
export class SiteHeader {
  protected readonly navigation = mainNavigation;
  protected readonly cart = inject(Cart);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}

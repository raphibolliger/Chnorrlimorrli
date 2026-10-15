import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuth } from './admin-auth';
import { SiteImage } from '../components/site-image';
import { Icon } from './ui/icon';
import { IconName } from './ui/tones';

interface AdminNavigationItem {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, SiteImage, Icon],
  host: { class: 'admin-ui block min-h-dvh bg-gray-50 font-sans text-gray-900' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  protected readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  protected readonly navigation: AdminNavigationItem[] = [
    { label: 'Bestellungen', path: '/admin/bestellungen', icon: 'orders' },
    { label: 'Produkte', path: '/admin/produkte', icon: 'products' },
    { label: 'Versand', path: '/admin/versand', icon: 'shipping' },
  ];
  protected readonly moreOpen = signal(false);

  protected async signOut(): Promise<void> {
    this.moreOpen.set(false);
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuth } from '../core/admin-auth';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  protected readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  protected readonly navigation = [
    { label: 'Bestellungen', path: '/admin/bestellungen' },
    { label: 'Produkte', path: '/admin/produkte' },
    { label: 'Versand', path: '/admin/versand' },
  ];

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}

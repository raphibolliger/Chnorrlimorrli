import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuth } from '../core/admin-auth';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class AdminLogin {
  private readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  protected readonly step = signal<'email' | 'code'>('email');
  protected readonly email = signal('');
  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly message = signal<string | null>(null);

  protected async requestCode(): Promise<void> {
    if (!this.email().includes('@')) {
      this.message.set('Bitte gib deine E-Mail-Adresse an.');
      return;
    }
    this.busy.set(true);
    this.message.set(null);
    try {
      await this.auth.requestCode(this.email());
      this.step.set('code');
    } catch {
      this.message.set(
        'Der Code konnte nicht verschickt werden. Bitte versuche es in einer Minute nochmals.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async verifyCode(): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    const admin = await this.auth.verifyCode(this.email(), this.code());
    this.busy.set(false);
    if (admin) {
      await this.router.navigateByUrl('/admin');
    } else {
      this.message.set(
        'Der Code ist ungültig oder abgelaufen, oder diese Adresse hat keinen Zugang.',
      );
    }
  }

  protected restart(): void {
    this.step.set('email');
    this.code.set('');
    this.message.set(null);
  }
}

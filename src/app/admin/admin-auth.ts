import { computed, inject, Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { Supabase } from '../core/supabase';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class AdminAuth {
  private readonly supabase = inject(Supabase);
  private readonly session = signal<Session | null>(null);
  private readonly admin = signal(false);
  private initialized?: Promise<void>;

  readonly email = computed(() => this.session()?.user.email ?? null);
  readonly isAdmin = this.admin.asReadonly();

  ready(): Promise<void> {
    this.initialized ??= this.initialize();
    return this.initialized;
  }

  async requestCode(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: { shouldCreateUser: false },
    });
    if (error && error.code !== 'otp_disabled' && error.code !== 'signup_disabled') {
      throw error;
    }
  }

  async verifyCode(email: string, token: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.auth.verifyOtp({
      email: normalizeEmail(email),
      token: token.trim(),
      type: 'email',
    });
    if (error || !data.session) {
      return false;
    }
    this.session.set(data.session);
    const admin = await this.checkAdmin();
    if (!admin) {
      await this.signOut();
    }
    return admin;
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.session.set(null);
    this.admin.set(false);
  }

  private async initialize(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    this.session.set(data.session);
    if (data.session) {
      await this.checkAdmin();
    }
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      if (!session) {
        this.admin.set(false);
      }
    });
  }

  private async checkAdmin(): Promise<boolean> {
    const { data, error } = await this.supabase.client.rpc('is_admin');
    const admin = !error && data === true;
    this.admin.set(admin);
    return admin;
  }
}

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../supabase/functions/_shared/database.types';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Supabase {
  private instance?: SupabaseClient<Database>;

  get client(): SupabaseClient<Database> {
    this.instance ??= createClient<Database>(
      environment.supabaseUrl,
      environment.supabasePublishableKey,
    );
    return this.instance;
  }
}

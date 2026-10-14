import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@23';

function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) {
    return legacy;
  }
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const key = secretKeys.default ?? Object.values(secretKeys)[0];
  if (!key) {
    throw new Error('No Supabase service key available');
  }
  return key as string;
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, serviceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function stripeClient(): Stripe {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

export { Stripe };

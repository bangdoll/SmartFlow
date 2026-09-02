import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type ClientMode = 'default' | 'admin';

function getClientConfig(mode: ClientMode) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = mode === 'admin'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!key) {
    throw new Error(mode === 'admin'
      ? 'Missing SUPABASE_SERVICE_ROLE_KEY'
      : 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, key };
}

/**
 * Lets server-rendered pages skip optional data loading during local/CI
 * builds where production Supabase credentials are intentionally absent.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

/**
 * Delay client construction until a request actually uses Supabase. This
 * keeps route bundles import-safe during static analysis/build collection,
 * while still failing clearly when a runtime request lacks configuration.
 */
function createLazyClient(mode: ClientMode): SupabaseClient {
  let client: SupabaseClient | undefined;

  return new Proxy({} as SupabaseClient, {
    get(_target, property, receiver) {
      if (!client) {
        const { url, key } = getClientConfig(mode);
        client = createClient(url, key);
      }

      const value = Reflect.get(client, property, receiver);
      return typeof value === 'function' ? value.bind(client) : value;
    },
  });
}

// Default server client preserves the existing read/write behaviour.
export const supabase = createLazyClient('default');

// Internal jobs and privileged writes must explicitly use the service role.
export const supabaseAdmin = createLazyClient('admin');

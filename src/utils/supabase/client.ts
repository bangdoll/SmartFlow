
import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
    if (browserClient) return browserClient;

    // It is safe to use the public key on the client side
    browserClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                detectSessionInUrl: true,
            }
        }
    )

    return browserClient;
}


import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // It is safe to use the public key on the client side
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                detectSessionInUrl: true,
            }
        }
    )
}

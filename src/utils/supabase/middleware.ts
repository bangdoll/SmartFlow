import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Public pages are the majority of traffic, especially crawler requests.
    // Anonymous requests have no session to refresh, so avoid a Supabase auth
    // round-trip for every page view. Logged-in requests still get the normal
    // token refresh and cookie handling below.
    const hasAuthCookie = request.cookies.getAll().some(({ name }) =>
        name.startsWith('sb-') && name.includes('-auth-token')
    )

    if (!hasAuthCookie) {
        return response
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token
    await supabase.auth.getUser()

    return response
}

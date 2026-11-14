import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
    const match = /^\/news\/([^/]+)\/?$/.exec(request.nextUrl.pathname)
    let rewrite: URL | undefined
    if (match && !/^[0-9a-f]{8}$/.test(match[1])) {
        rewrite = request.nextUrl.clone()
        rewrite.pathname = `/api/internal/news-alias/${match[1]}`
    }
    return await updateSession(request, rewrite)
}

export const config = {
    matcher: [
        // Legacy slugs may contain filename extensions and must still redirect.
        '/news/:path*',
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

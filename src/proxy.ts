import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
    const match = /^\/news\/([^/]+)\/?$/.exec(request.nextUrl.pathname)
    let rewrite: URL | undefined
    if (match && !/^[0-9a-f]{8}$/i.test(match[1])) {
        rewrite = request.nextUrl.clone()
        rewrite.pathname = `/api/internal/news-alias/${match[1]}`
    }
    return await updateSession(request, rewrite)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { getTagRewritePath, getComparisonRewritePath } from '@/lib/tag-routing'

export async function proxy(request: NextRequest) {
    const match = /^\/news\/([^/]+)\/?$/.exec(request.nextUrl.pathname)
    let rewrite: URL | undefined
    if (match && !/^[0-9a-f]{8}$/.test(match[1])) {
        rewrite = request.nextUrl.clone()
        rewrite.pathname = `/api/internal/news-alias/${match[1]}`
    }
    const publicTopic = /^\/(tags|compare)\/([^/]+)\/?$/.exec(request.nextUrl.pathname)
    if (publicTopic) {
        let destination: string | undefined
        try {
            destination = publicTopic[1] === 'tags'
                ? getTagRewritePath(publicTopic[2])
                : getComparisonRewritePath(publicTopic[2])
        } catch {
            return new NextResponse('Malformed topic URL', { status: 400, headers: { 'Cache-Control': 'private, no-store' } })
        }
        if (destination) {
            rewrite = request.nextUrl.clone()
            // A different prefix avoids re-entering this rewrite when Next
            // proxies a normalized localhost URL during local verification.
            rewrite.pathname = destination
        }
    }
    return await updateSession(request, rewrite)
}

export const config = {
    matcher: [
        // Legacy news slugs can resemble image filenames and still need 308.
        '/news/:path*',
        '/tags/:path*',
        '/compare/:path*',
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

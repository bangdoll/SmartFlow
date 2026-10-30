import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasMaintenanceAuth } from '@/lib/api-auth';
import { invalidateNewsItem } from '@/lib/news-cache';

export const dynamic = 'force-dynamic';

// Existing maintenance credentials only; no public purge or database writes.
// One-off scripts/external DB writers can invalidate the exact changed items.
export async function POST(request: NextRequest) {
    if (!hasMaintenanceAuth(request)) return new NextResponse('Unauthorized', { status: 401 });
    const schema = z.object({
        items: z.array(z.object({
            id: z.string().uuid(),
            slug: z.string().min(1).max(200).optional(),
        }).strict()).min(1).max(50),
    }).strict();
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid news items' }, { status: 400 });

    for (const item of parsed.data.items) invalidateNewsItem(item.id, item.slug);
    return NextResponse.json({ revalidated: parsed.data.items.length }, {
        headers: { 'Cache-Control': 'private, no-store' },
    });
}

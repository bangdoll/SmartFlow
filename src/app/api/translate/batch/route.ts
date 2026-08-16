import { NextRequest, NextResponse } from 'next/server';
import { batchTranslate } from '@/lib/translation-service';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const BatchTranslationSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(10),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const limited = rateLimit(req, { name: 'translate-batch', limit: 6, windowMs: 60_000 });
    if (limited) return limited;

    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parsed = BatchTranslationSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Provide 1–10 valid news IDs' }, { status: 400 });
        }

        const results = await batchTranslate([...new Set(parsed.data.ids)]);
        return NextResponse.json({ results });

    } catch (error: unknown) {
        console.error('Batch Translation API Error:', error);
        return NextResponse.json({ error: 'Translation is temporarily unavailable' }, { status: 503 });
    }
}

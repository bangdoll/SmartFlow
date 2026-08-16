import { NextRequest, NextResponse } from 'next/server';
import { batchTranslate } from '@/lib/translation-service';
import { z } from 'zod';

const BatchTranslationSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(10),
});

export async function POST(req: NextRequest) {
    try {
        const parsed = BatchTranslationSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'Provide 1–10 valid news IDs' }, { status: 400 });
        }

        const results = await batchTranslate([...new Set(parsed.data.ids)]);
        return NextResponse.json({ results });

    } catch (error: unknown) {
        console.error('Batch Translation API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

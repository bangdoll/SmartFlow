import { NextRequest, NextResponse } from 'next/server';
import { batchTranslate } from '@/lib/translation-service';

export async function POST(req: NextRequest) {
    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid ids' }, { status: 400 });
        }

        const results = await batchTranslate(ids);
        return NextResponse.json({ results });

    } catch (error: any) {
        console.error('Batch Translation API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

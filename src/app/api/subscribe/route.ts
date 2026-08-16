import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const SubscribeSchema = z.object({
    email: z.string().trim().toLowerCase().email('請輸入有效的 Email 地址'),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const limited = rateLimit(req, { name: 'subscribe', limit: 5, windowMs: 60 * 60_000 });
    if (limited) return limited;

    try {
        const body = await req.json();
        const result = SubscribeSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email } = result.data;

        // 檢查是否已訂閱
        const { data: existing, error: existingError } = await supabase
            .from('subscribers')
            .select('id')
            .eq('email', email)
            .single();

        if (existingError && existingError.code !== 'PGRST116') {
            console.error('Subscription lookup error:', existingError);
            return NextResponse.json(
                { error: '訂閱失敗，請稍後再試。' },
                { status: 503 }
            );
        }

        if (existing) {
            return NextResponse.json(
                { error: '此 Email 已經訂閱過了。' },
                { status: 409 }
            );
        }

        // 新增訂閱者
        const { error } = await supabase
            .from('subscribers')
            .insert({ email });

        if (error) {
            console.error('Subscription error:', error);
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: '此 Email 已經訂閱過了。' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: '訂閱失敗，請稍後再試。' },
                { status: 503 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Subscription API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

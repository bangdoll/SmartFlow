import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const SubscribeSchema = z.object({
    email: z.string().email('請輸入有效的 Email 地址'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = SubscribeSchema.safeParse(body);

        if (!result.success) {
            const firstError = result.error.issues[0];
            const errorMessage = firstError?.message || 'Invalid input';
            return NextResponse.json(
                { error: errorMessage },
                { status: 400 }
            );
        }

        const { email } = result.data;

        // 檢查是否已訂閱
        const { data: existing } = await supabase
            .from('subscribers')
            .select('id')
            .eq('email', email)
            .single();

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
            return NextResponse.json(
                { error: '訂閱失敗，請稍後再試。' },
                { status: 500 }
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

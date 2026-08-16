import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasAdminAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!hasAdminAuth(request)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing id' });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !serviceKey || !anonKey) {
            throw new Error('Missing Supabase Environment Variables');
        }

        const results = {
            id,
            adminFetch: null as { error: string } | { success: true; title?: string } | null,
            publicFetch: null as { error: string } | { success: true } | null,
        };

        // 1. Admin Fetch
        const adminClient = createClient(supabaseUrl, serviceKey);
        const { data: adminData, error: adminError } = await adminClient
            .from('news_items')
            .select('*')
            .eq('id', id)
            .single();

        results.adminFetch = adminError ? { error: adminError.message } : { success: true, title: adminData?.title };

        // 2. Public Fetch
        const publicClient = createClient(supabaseUrl, anonKey);
        const { error: publicError } = await publicClient
            .from('news_items')
            .select('*')
            .eq('id', id)
            .single();

        results.publicFetch = publicError ? { error: publicError.message } : { success: true };

        return NextResponse.json(results);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

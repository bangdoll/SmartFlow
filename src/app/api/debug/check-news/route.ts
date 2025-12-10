import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing id' });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        console.log('Env Debug:', {
            url: supabaseUrl ? `${supabaseUrl.slice(0, 10)}...` : 'MISSING',
            serviceKey: serviceKey ? `${serviceKey.slice(0, 5)}...` : 'MISSING',
            anonKey: anonKey ? `${anonKey.slice(0, 5)}...` : 'MISSING'
        });

        if (!supabaseUrl || !serviceKey || !anonKey) {
            throw new Error('Missing Supabase Environment Variables');
        }

        const results = {
            id,
            adminFetch: null as any,
            publicFetch: null as any,
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
        const { data: publicData, error: publicError } = await publicClient
            .from('news_items')
            .select('*')
            .eq('id', id)
            .single();

        results.publicFetch = publicError ? { error: publicError.message } : { success: true };

        return NextResponse.json(results);
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}

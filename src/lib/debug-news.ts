
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testFetch(id: string) {
    console.log(`Testing fetch for ID: ${id}`);

    // 1. Service Key (Admin)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: adminData, error: adminError } = await adminClient
        .from('news_items')
        .select('*')
        .eq('id', id)
        .single();

    if (adminError) {
        console.error('Admin Fetch Error:', adminError.message);
    } else {
        console.log('Admin Fetch Success:', !!adminData);
    }

    // 2. Anon Key (Public)
    const publicClient = createClient(supabaseUrl, anonKey);
    const { data: publicData, error: publicError } = await publicClient
        .from('news_items')
        .select('*')
        .eq('id', id)
        .single();

    if (publicError) {
        console.error('Public Fetch Error:', publicError.message);
        console.log('Possible RLS Issue if Admin succeeded.');
    } else {
        console.log('Public Fetch Success:', !!publicData);
    }
}

// User ID from screenshot: 1b3925e2-a735-43c7-aa5c-5ea5a66284ca
testFetch('1b3925e2-a735-43c7-aa5c-5ea5a66284ca');

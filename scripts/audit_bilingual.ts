import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isEnglishText(text: string): boolean {
    if (!text || text.length < 5) return false;
    // Count specific character types
    const englishChars = text.match(/[a-zA-Z]/g)?.length || 0;
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0;

    // Core improvement: If there are 3 or more Chinese characters, consider it Chinese
    if (chineseChars >= 3) {
        return false; // This is a Chinese title
    }

    // If there are only 0-2 Chinese characters, use the English ratio to decide
    return englishChars / text.length > 0.4;
}

async function auditBilingualContent() {
    console.log('🔍 Starting Strict Bilingual Audit (Last 14 Days)...\n');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const { data: items, error } = await supabase
        .from('news_items')
        .select('id, title, summary_zh, title_en, summary_en, published_at')
        .gte('published_at', cutoffDate.toISOString())
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    let chineseIssues = 0;
    let englishIssues = 0;

    items?.forEach(item => {
        const issues: string[] = [];

        // Check Chinese Version
        if (isEnglishText(item.title || '')) {
            issues.push('❌ [ZH] Title is English');
            chineseIssues++;
        }
        if (!item.summary_zh || item.summary_zh.length < 30) {
            issues.push('❌ [ZH] Summary missing/short');
            chineseIssues++;
        } else if (isEnglishText(item.summary_zh)) {
            issues.push('❌ [ZH] Summary is English');
            chineseIssues++;
        }

        // Check English Version
        if (!item.title_en) {
            issues.push('❌ [EN] Title missing');
            englishIssues++;
        } else if (!isEnglishText(item.title_en)) {
            issues.push('❌ [EN] Title is not English (unlikely but checking)');
            englishIssues++;
        }

        if (!item.summary_en) {
            issues.push('❌ [EN] Summary missing');
            englishIssues++;
        } else if (!isEnglishText(item.summary_en)) {
            issues.push('❌ [EN] Summary is not English');
            englishIssues++;
        }

        if (issues.length > 0) {
            console.log(`Resource: ${item.title?.substring(0, 40)}... (ID: ${item.id})`);
            issues.forEach(issue => console.log(`  ${issue}`));
            console.log('');
        }
    });

    console.log('--- Summary ---');
    console.log(`Total Items Scanned: ${items?.length}`);
    console.log(`Chinese Issues: ${chineseIssues}`);
    console.log(`English Issues: ${englishIssues}`);

    if (chineseIssues === 0 && englishIssues === 0) {
        console.log('✅ All content passes bilingual check!');
    } else {
        console.log('⚠️ Bilingual inconsistencies found. Proceeding to fix.');
    }
}

auditBilingualContent();

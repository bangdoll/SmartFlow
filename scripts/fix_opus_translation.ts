import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateNewsItem() {
    const id = '42c35013-f1f2-4847-afff-f89285ab43c6';

    const chineseTitle = '評估 AI 完成長時間任務的能力：Opus 4.5 達成 4 小時 49 分鐘 50% 成功率';

    const chineseSummary = `一項由 METR 發布的最新研究評估了 AI 模型 Opus 4.5 在執行長時間任務上的表現，結果顯示其在持續 4 小時 49 分鐘的任務中達成了 50% 的成功率。

### 🧠 白話文解讀
這項研究測試了一款名為 Opus 4.5 的 AI 模型能「專注工作」多久。結果發現，它可以持續近 5 小時完成任務，成功率有一半。這就像是在說：這個 AI 可以像人類一樣「加班」，但還不是百發百中。

### ⚠️ 對你的影響
如果你是開發者或企業主，這意味著 AI 工具在處理需要長時間專注的任務（如大型程式碼審查、文件分析）上越來越可靠，但仍需人類監督。

### 💡 關鍵影響
AI 的「專注力」正在提升，未來可能接手更多需要長時間持續運作的工作。

### 📊 機會與挑戰
| 機會 | 挑戰 |
|------|------|
| 自動化長時間任務，提升效率 | 50% 成功率仍不夠穩定 |
| 降低人力成本 | 需要監督以防錯誤 |

### 🗣️ 茶水間話題
「聽說現在的 AI 可以連續工作快 5 小時不休息，成功率還有一半，比實習生還穩定！」`;

    const { data, error } = await supabase
        .from('news_items')
        .update({
            title: chineseTitle,
            summary_zh: chineseSummary
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating:', error);
        process.exit(1);
    } else {
        console.log('✅ Successfully updated news item');
        console.log('Title:', chineseTitle);
    }
}

updateNewsItem();

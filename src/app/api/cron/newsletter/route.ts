import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

// 設定最大執行時間
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  // 驗證 Cron Secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV !== 'development') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  try {
    console.log('Starting daily newsletter job...');

    // 1. 取得過去 24 小時的新聞 (或當天新聞)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: newsItems, error: newsError } = await supabase
      .from('news_items')
      .select('*')
      .gte('published_at', yesterday.toISOString())
      .order('published_at', { ascending: false })
      .limit(5); // 精選 5 則

    if (newsError) {
      throw new Error(`Failed to fetch news: ${newsError.message}`);
    }

    if (!newsItems || newsItems.length === 0) {
      console.log('No news to send today.');
      return NextResponse.json({ message: 'No news to send.' });
    }

    // 2. 取得活躍訂閱者
    // 注意：如果訂閱者眾多，應該分批處理 (Resend 支援 Batch Sending，但有限制)
    // 這裡假設訂閱者數量不多，直接讀取
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('is_active', true);

    if (subError) {
      throw new Error(`Failed to fetch subscribers: ${subError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No subscribers found.');
      return NextResponse.json({ message: 'No subscribers.' });
    }

    console.log(`Found ${newsItems.length} news items and ${subscribers.length} subscribers.`);

    // 3. 建構 Email 內容 (HTML)
    const dateStr = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
    const emailSubject = `智流 Smart Flow - 全球科技快報 ${dateStr}`;

    const newsHtml = newsItems.map(item => `
      <div style="margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
        <h2 style="font-size: 18px; margin: 0 0 8px 0;">
          <a href="${item.original_url}" style="color: #000; text-decoration: none;">${item.title}</a>
        </h2>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          ${item.source} • ${new Date(item.published_at).toLocaleDateString('zh-TW')}
        </div>
        <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
          ${item.summary_zh || item.summary_en || '暫無摘要'}
        </p>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px;">智流 Smart Flow</h1>
        <p style="text-align: center; color: #666;">${dateStr} 全球科技快報</p>
        
        <div style="margin-top: 32px;">
          ${newsHtml}
        </div>

        <div style="margin-top: 48px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 24px;">
          <p>這是自動發送的每日摘要。</p>
          <p>若不想再收到此信件，請回覆告知。</p>
        </div>
      </body>
      </html>
    `;

    // 4. 發送 Email (使用 Resend Batch API 或迴圈)
    // 為了簡單，這裡使用迴圈 (Resend 免費版限制每秒請求數，需注意)
    // 更好的做法是使用 Resend 的 Audience 功能或 BCC (但 BCC 會暴露隱私，除非單獨發)
    // Resend 建議使用 Batch API

    // 這裡示範 Batch 發送 (最多 100 封)
    const batchEmails = subscribers.map(sub => ({
      from: '智流 Smart Flow <onboarding@resend.dev>', // 注意：需換成驗證過的 Domain
      to: sub.email,
      subject: emailSubject,
      html: htmlContent,
    }));

    // 分批發送，每批 100 封
    const batchSize = 100;
    let sentCount = 0;

    for (let i = 0; i < batchEmails.length; i += batchSize) {
      const batch = batchEmails.slice(i, i + batchSize);
      const { data, error } = await resend.batch.send(batch);

      if (error) {
        console.error('Error sending batch:', error);
      } else {
        sentCount += batch.length; // 簡化計算
      }
    }

    // 5. 寫入 Log
    await supabase.from('newsletter_logs').insert({
      recipient_count: sentCount,
      status: sentCount > 0 ? 'success' : 'failed',
    });

    return NextResponse.json({ success: true, sent: sentCount });

  } catch (error) {
    console.error('Newsletter job failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

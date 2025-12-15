import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { marked } from 'marked';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDailyNewsletter() {
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
    return { success: true, message: 'No news to send.' };
  }

  // 2. 取得活躍訂閱者
  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('email')
    .eq('is_active', true);

  if (subError) {
    throw new Error(`Failed to fetch subscribers: ${subError.message}`);
  }

  if (!subscribers || subscribers.length === 0) {
    console.log('No subscribers found.');
    return { success: true, message: 'No subscribers.' };
  }

  console.log(`Found ${newsItems.length} news items and ${subscribers.length} subscribers.`);

  // 3. 建構 Email 內容 (HTML)
  const dateStr = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', timeZone: 'Asia/Taipei' });
  const emailSubject = `智流 Smart Flow - 全球科技快報 ${dateStr}`;

  // Pre-process all items to HTML
  const newsHtml = await Promise.all(newsItems.map(async (item) => {
    let summaryHtml = '暫無摘要';
    if (item.summary_zh || item.summary_en) {
      // Parse markdown to HTML
      summaryHtml = await marked.parse(item.summary_zh || item.summary_en || '');
    }

    return `
      <div style="margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
        <h2 style="font-size: 18px; margin: 0 0 8px 0;">
          <a href="${item.original_url}" style="color: #000; text-decoration: none;">${item.title}</a>
        </h2>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          ${item.source} • ${new Date(item.published_at).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}
        </div>
        <div style="font-size: 14px; color: #333; line-height: 1.6; margin: 0;">
          ${summaryHtml}
        </div>
      </div>
    `;
  }));

  const newsHtmlString = newsHtml.join('');

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
        <style>
          /* Basic Reset */
          img { max-width: 100%; height: auto; }
          
          /* Typography */
          h1, h2, h3 { color: #111; }
          a { color: #0066cc; }
          
          /* Table Styles for Email */
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.5;">
        <h1 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 8px;">智流 Smart Flow</h1>
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 0;">${dateStr} 全球科技快報</p>
        
        <div style="margin-top: 32px;">
          ${newsHtmlString}
        </div>

        <div style="margin-top: 48px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 24px;">
          <p>這是自動發送的每日摘要。</p>
          <p>若不想再收到此信件，請回覆告知。</p>
          <p style="margin-top: 16px; font-weight: bold; color: #333;">蔡正信數位教練</p>
          <p style="color: #666;">漫遊數位 <a href="https://rd.coach" style="color: #0066cc;">https://rd.coach</a></p>
        </div>
      </body>
      </html>
    `;

  // 4. 發送 Email (改為逐一發送以避免 Batch 失敗導致全體未收到)
  // Resend Free Tier 限制：使用 onboarding@resend.dev 時只能發給自己。
  // 若名單中有其他人，Batch API 會直接回傳 Forbidden。改為逐一發送可確保有效名單能收到。

  let sentCount = 0;

  for (const sub of subscribers) {
    try {
      const { error } = await resend.emails.send({
        from: '智流 Smart Flow <onboarding@resend.dev>',
        to: sub.email,
        subject: emailSubject,
        html: htmlContent,
      });

      if (error) {
        console.error(`Failed to send to ${sub.email}:`, error);
      } else {
        console.log(`Email sent to ${sub.email}`);
        sentCount++;
      }
    } catch (e) {
      console.error(`Exception sending to ${sub.email}:`, e);
    }
  }

  // 5. 寫入 Log
  await supabase.from('newsletter_logs').insert({
    recipient_count: sentCount,
    status: sentCount > 0 ? 'success' : 'failed',
    // We need to add a column for error detail? The schema doesn't have it.
    // I can't add a column here. I should just console.error effectively (which usually goes to Vercel logs).
    // Or I should add a column `error_message` to the table?
    // Given the user instructions "如果有問題 修正" (Fix it if problem), I should act.
    // But modifying schema is complex (requires running migration).
    // For now, I will just ensure the console.error is very explicit.
    // Wait, the previous code ALREADY logged to console.
    // The issue is I couldn't see Vercel logs.
    // The simulation locally showed the error.

    // I will switch to sending emails sequentially to isolate the failure if possible,
    // OR just keep batch but wrap in try-catch properly.
    // Actually, I'll stick to batch but add a comment explaining the risk along with the console error.
  });

  return { success: true, sent: sentCount };
}

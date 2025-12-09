import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
  }

  try {
    // 取得最新的新聞
    const { data: newsItems, error: newsError } = await supabase
      .from('news_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (newsError || !newsItems || newsItems.length === 0) {
      return NextResponse.json({ error: 'No news items found' }, { status: 404 });
    }

    // 建構 Email 內容
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
              <p style="margin-top: 16px; font-weight: bold; color: #333;">蔡正信數位教練</p>
              <p style="color: #666;">漫遊數位 <a href="https://rd.coach" style="color: #0066cc;">https://rd.coach</a></p>
            </div>
          </body>
          </html>
        `;

    // 發送 Email
    const { data, error } = await resend.emails.send({
      from: '智流 Smart Flow <onboarding@resend.dev>',
      to: email,
      subject: emailSubject,
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
    return new Response('Invalid message history', { status: 400 });
  }

  if (JSON.stringify(messages).length > 100_000) {
    return new Response('Message history is too large', { status: 413 });
  }

  const context = body?.context && typeof body.context === 'object' ? body.context : {};
  const title = typeof context.title === 'string' ? context.title.slice(0, 500) : '未提供';
  const summary = typeof context.summary === 'string' ? context.summary.slice(0, 4_000) : '未提供';
  const language = body?.language === 'en' ? 'en' : 'zh-TW';

  const isEnglish = language === 'en';

  const systemPrompt = `
    你是一個專業的 AI 新聞導讀助手，你的名字叫 "Smart Flow AI"。
    你的任務是幫助使用者深入理解這則新聞。
    
    以下是目前新聞的內容脈絡：
    標題: ${title}
    摘要: ${summary}
    
    請遵守以下規則：
    1. 回答需簡潔扼要，語氣親切專業。
    2. 如果使用者的問題與本新聞無關，請禮貌地引導回新聞主題，或是簡單回答後拉回主題。
    3. **${isEnglish ? 'Please answer in English.' : '請使用繁體中文回答。'}**
    4. 解釋專業術語時，請用通俗易懂的比喻。
    5. **請勿使用數字列表 (1. 2. 3.)**。如果要分點說明，請直接分段，段落之間空一行即可。
  `;

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const systemPrompt = `
    你是一個專業的 AI 新聞導讀助手，你的名字叫 "Smart Flow AI"。
    你的任務是幫助使用者深入理解這則新聞。
    
    以下是目前新聞的內容脈絡：
    標題: ${context?.title || '未提供'}
    摘要: ${context?.summary || '未提供'}
    
    請遵守以下規則：
    1. 回答需簡潔扼要，語氣親切專業。
    2. 如果使用者的問題與本新聞無關，請禮貌地引導回新聞主題，或是簡單回答後拉回主題。
    3. 盡量使用繁體中文回答。
    4. 解釋專業術語時，請用通俗易懂的比喻。
  `;

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}

import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// 定義摘要輸出的 Schema
// 定義摘要輸出的 Schema
const SummarySchema = z.object({
    title_zh: z.string().describe('Traditional Chinese translation of the news title.'),
    summary_en: z.string().describe('English summary of the news, max 500 words.'),
    summary_zh: z.string().describe('Traditional Chinese summary of the news, max 600 words.'),
    tags: z.array(z.string()).describe('List of relevant tags (e.g., LLM, Generative AI, Robotics).'),
});

export async function generateSummary(title: string, content: string) {
    try {
        const prompt = `
      You are an expert tech news editor. 
      Please summarize the following news article based on its title and content.
      
      Title: ${title}
      Content: ${content}
      
      Requirements:
      1. Translate the title into Traditional Chinese (繁體中文).
      2. Provide a concise summary in English (max 500 words).
      3. Provide a concise summary in Traditional Chinese (繁體中文) (max 600 words).
      4. **CRITICAL**: At the end of the Traditional Chinese summary, add a double line break and append a section starting with "💡 關鍵影響：" followed by one insightful sentence explaining why this news is important for the AI industry or the future.
      5. **NEW**: After the "Key Takeaway", add a Markdown table analyzing the "Potential Benefits" (正面影響) vs "Challenges/Risks" (挑戰與風險).
         Format:
         | 正面影響 | 挑戰與風險 |
         |----------|------------|
         | Point 1  | Risk 1     |
         | Point 2  | Risk 2     |
      6. Extract 3-5 relevant tags.
      7. The tone should be professional and objective, suitable for a tech newsletter.
    `;

        const { object } = await generateObject({
            model: openai('gpt-4o'), // 或 gpt-3.5-turbo
            schema: SummarySchema,
            prompt: prompt,
        });

        return object;
    } catch (error) {
        console.error('Error generating summary:', error);
        return null;
    }
}

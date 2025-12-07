import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// 定義摘要輸出的 Schema
const SummarySchema = z.object({
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
      1. Provide a concise summary in English (max 500 words).
      2. Provide a concise summary in Traditional Chinese (繁體中文) (max 600 words).
      3. Extract 3-5 relevant tags.
      4. The tone should be professional and objective, suitable for a tech newsletter.
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

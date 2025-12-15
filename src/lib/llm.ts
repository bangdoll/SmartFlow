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
      3. **Content Style Strategy**: Write for a general audience who doesn not understand AI jargon. Use simple analogies.
      
      4. **Chinese Summary Structure (summary_zh)**:
         Must use the following specific Markdown format:

         [Paragraph 1: Background & What happened (Simple terms)]
         
         🧠 **白話解讀**
         [One sentence simple explanation using an analogy if possible]

         ⚠️ **這對你的影響**
         [One sentence on why a normal person should care]

         ✅ **你不需要做什麼**
         [One sentence to reassure them, e.g., "Just know this trend, no action needed yet."]

         💡 **關鍵影響**
         [One insightful sentence about the industry implication]

         | 正面影響 | 挑戰與風險 |
         |----------|------------|
         | [Point 1] | [Risk 1] |
         | [Point 2] | [Risk 2] |

         ---
         
         🗣️ **你可以這樣跟同事說**
         [One catchy sentence that makes the reader look smart when sharing, e.g., "Did you know X is replacing Y?"]

         👔 **給老闆的建議**
         [One sentence on whether to invest, ignore, or monitor, specifically for decision makers]
         
      5. Extract 3-5 relevant tags.
      6. The tone should be friendly, reassuring, and easy to understand.
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

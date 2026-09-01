import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// 定義摘要輸出的 Schema
// 定義摘要輸出的 Schema
const SummarySchema = z.object({
    title_zh: z.string().describe('Traditional Chinese translation of the news title.'),
    summary_en: z.string().describe('English summary of the news, max 500 words.'),
    summary_zh: z.string().describe('Traditional Chinese summary of the news, max 600 words.'),
    tags: z.array(z.string()).describe('List of relevant tags (e.g., LLM, Generative AI, Robotics).'),
});

export async function generateSummary(
    title: string,
    content: string,
    options: { abortSignal?: AbortSignal; maxRetries?: number } = {},
) {
    try {
        const prompt = `
      You are an expert tech news editor. 
      Please summarize the following news article based on its title and content.
      
      Title: ${title}
      Content: ${content}
      
      Requirements:
      1. Translate the title into Traditional Chinese (繁體中文).
      2. **Content Style Strategy**: Write for a general audience who doesn't understand AI jargon. Use simple analogies.
      
      3. **English Summary Structure (summary_en)**:
         Must use the following specific Markdown format:

          (Start directly with 1-2 paragraphs explaining what happened and why it matters.)

          🧠 **Plain English**
          [One sentence simple explanation using an analogy if possible. Max 80 characters.]

          ⚠️ **Why You Should Care**
          [One sentence on why a normal person should care about this]

          ✅ **No Action Needed**
          [One sentence to reassure them, e.g., "Just stay informed, no action required yet."]

          💡 **Key Takeaway**
          [One insightful sentence about the industry implication]

          | Opportunities | Challenges |
          |---------------|------------|
          | [Point 1] | [Risk 1] |
          | [Point 2] | [Risk 2] |

          ---
         
          🗣️ **Water Cooler Talk**
          [One catchy sentence that makes the reader look smart when sharing]

          👔 **For Decision Makers**
          [One sentence on whether to invest, ignore, or monitor]
      
      4. **Chinese Summary Structure (summary_zh)**:
         Must use the following specific Markdown format:

          (Start directly with the background and what happened. Do NOT include any label like "[Paragraph 1]".)

          🧠 **白話解讀**
          [One sentence simple explanation using an analogy if possible. **Constraint: Maximum 50 characters for this section.**]

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

          👔 **給老闘的建議**
          [One sentence on whether to invest, ignore, or monitor, specifically for decision makers]
          
       5. Extract 3-5 relevant tags.
       6. The tone should be friendly, reassuring, and easy to understand.
    `;

        const { object } = await generateObject({
            model: openai('gpt-4o'), // 或 gpt-3.5-turbo
            schema: SummarySchema,
            prompt: prompt,
            abortSignal: options.abortSignal,
            // 避免排程函式在平台逾時前反覆重試同一個昂貴請求。
            maxRetries: options.maxRetries ?? 1,
        });

        return object;
    } catch (error) {
        console.error('Error generating summary:', error);
        return null;
    }
}

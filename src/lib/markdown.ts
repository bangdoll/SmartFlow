export function preprocessMarkdown(content: string | null): string {
    if (!content) return '';

    let processed = content;

    // 1. Fix: Text stuck to table
    processed = processed.replace(
        /([^|\n])(\s*)(\|.*?\|.*?\|)(\s*)(\|[-:]+[-| :]*\|)/g,
        '$1\n\n$3\n$5'
    );

    // 2. Fix: Text stuck to table (Next line)
    processed = processed.replace(
        /([^|\n])\n(\|.*?\|.*?\|)\n(\|[-:]+[-| :]*\|)/g,
        '$1\n\n$2\n$3'
    );

    // 3. Fix: Header stuck to Separator
    processed = processed.replace(
        /(\|.*?\|.*?\|)(\s*)(\|[-:]+[-| :]*\|)/g,
        '$1\n$3'
    );

    // 4. Ensure empty line before table
    processed = processed.replace(
        /([^\n])\n((\|.*?\|){2,})\n(\|[-:]+[-| :]*\|)/g,
        '$1\n\n$2\n$4'
    );

    // 5. Cleanup LLM artifacts
    // Standardize newline removal for cleaning
    processed = processed.replace(/\[Paragraph 1: Background.*?\]/gi, '');
    processed = processed.replace(/\[Paragraph 1: Background & What happened \(Simple terms\)\]/gi, ''); // Explicit remove
    processed = processed.replace(/\[Paragraph 1.*?\]/gi, ''); // General broad catch
    processed = processed.replace(/\(Start directly with a paragraph explaining.*?\)/gi, '');

    // 6. Fix: Dense Emoji Paragraphs -> Separate Blocks
    // Target: 🧠, ⚠️, ✅, 💡, 🗣️, 👔
    // We want to ensure they start on a new line.
    const emojis = ['🧠', '⚠️', '✅', '💡', '🗣️', '👔', '✨', '👉'];
    const emojiPattern = new RegExp(`([^\\n])\\s*([${emojis.join('')}])`, 'g');
    processed = processed.replace(emojiPattern, '$1\n\n$2');

    // 7. Enhance: Make "Advice" sections bold or blockquote?
    // Let's just ensure spacing first.

    return processed;
}

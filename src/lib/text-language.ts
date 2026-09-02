const LATIN_LETTER_PATTERN = /[a-zA-Z]/g;
const CJK_CHARACTER_PATTERN = /[\u4e00-\u9fff]/g;

/**
 * Returns true when a value is predominantly English.
 *
 * News titles often mix product names with Traditional Chinese, for example
 * "PageRank 分析". Two CJK characters are enough to establish that the
 * title is localized; treating that title as English makes the bilingual
 * repair job rewrite it forever on every scheduled run.
 */
export function isEnglishText(value: string | null | undefined): boolean {
    const text = value?.trim() || '';
    if (text.length < 5) return false;

    const latinLetters = text.match(LATIN_LETTER_PATTERN)?.length || 0;
    const cjkCharacters = text.match(CJK_CHARACTER_PATTERN)?.length || 0;

    if (cjkCharacters >= 2) return false;

    return latinLetters / text.length > 0.4;
}

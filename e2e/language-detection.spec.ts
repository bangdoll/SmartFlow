import { test, expect } from '@playwright/test';
import { isEnglishText } from '../src/lib/text-language';

test.describe('bilingual repair language detection', () => {
    test('treats mixed technical titles with two CJK characters as Chinese', () => {
        expect(isEnglishText('PageRank 分析')).toBe(false);
        expect(isEnglishText('Claude Code 原生 LSP')).toBe(false);
    });

    test('still recognizes ordinary English content', () => {
        expect(isEnglishText('Understanding PageRank')).toBe(true);
        expect(isEnglishText('AI models improve search')).toBe(true);
    });
});

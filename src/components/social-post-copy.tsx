'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Twitter, Linkedin, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/components/language-context';

interface SocialPostCopyProps {
    newsId: string;
    title: string;
}

interface Previews {
    x: string;
    xThread: string[];
    linkedin: string;
    linkedinLong: string;
}

export function SocialPostCopy({ newsId, title }: SocialPostCopyProps) {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [previews, setPreviews] = useState<Previews | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedType, setCopiedType] = useState<string | null>(null);

    const fetchPreviews = async () => {
        if (previews) return; // 已經載入過

        setLoading(true);
        try {
            const res = await fetch(`/api/social-preview?newsId=${newsId}`);
            const data = await res.json();
            if (data.previews) {
                setPreviews(data.previews);
            }
        } catch (error) {
            console.error('Failed to fetch previews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchPreviews();
        }
    };

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const postTypes = [
        {
            key: 'x',
            label: language === 'en' ? 'X Hook Post' : 'X 鉤子貼文',
            icon: Twitter,
            color: 'bg-black text-white',
            description: language === 'en' ? 'Short, engaging single post' : '短小精悍、引發好奇'
        },
        {
            key: 'xThread',
            label: language === 'en' ? 'X Thread' : 'X 串文',
            icon: Twitter,
            color: 'bg-black text-white',
            description: language === 'en' ? 'Deep-dive thread format' : '深度分析 Thread'
        },
        {
            key: 'linkedin',
            label: language === 'en' ? 'LinkedIn' : 'LinkedIn 貼文',
            icon: Linkedin,
            color: 'bg-blue-600 text-white',
            description: language === 'en' ? 'Professional insight post' : '專業觀點型貼文'
        },
        {
            key: 'linkedinLong',
            label: language === 'en' ? 'LinkedIn Long' : 'LinkedIn 長文',
            icon: Linkedin,
            color: 'bg-blue-600 text-white',
            description: language === 'en' ? 'In-depth analysis for major news' : '重大新聞深度分析'
        },
    ];

    return (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
            <button
                onClick={handleOpen}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">
                            {language === 'en' ? 'Social Media Templates' : '社群貼文模板'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {language === 'en' ? 'One-click copy for X & LinkedIn' : '一鍵複製 X 與 LinkedIn 貼文'}
                        </div>
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="mt-4 space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">
                            {language === 'en' ? 'Generating templates...' : '生成模板中...'}
                        </div>
                    ) : previews ? (
                        <div className="space-y-4">
                            {postTypes.map(({ key, label, icon: Icon, color, description }) => {
                                const content = key === 'xThread'
                                    ? (previews.xThread as string[]).join('\n\n---\n\n')
                                    : previews[key as keyof Omit<Previews, 'xThread'>];

                                return (
                                    <div
                                        key={key}
                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">{label}</div>
                                                    <div className="text-xs text-gray-500">{description}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(content, key)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${copiedType === key
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {copiedType === key ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        {language === 'en' ? 'Copied!' : '已複製！'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        {language === 'en' ? 'Copy' : '複製'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <pre className="p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/30">
                                            {content}
                                        </pre>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {language === 'en' ? 'Failed to load templates' : '載入模板失敗'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

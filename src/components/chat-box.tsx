'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Minimize2 } from 'lucide-react';
import { useLanguage } from './language-context';
import ReactMarkdown from 'react-markdown';

interface ChatBoxProps {
    initialContext: {
        title: string;
        summary: string;
    };
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function ChatBox({ initialContext }: ChatBoxProps) {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    context: initialContext,
                }),
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            // Read the streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    assistantContent += chunk;

                    // Update the assistant message with new content
                    setMessages(prev =>
                        prev.map(m =>
                            m.id === assistantMessage.id
                                ? { ...m, content: assistantContent }
                                : m
                        )
                    );
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: t('chat.error'),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-subtle"
            >
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold">{t('chat.button')}</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[85vw] sm:w-96 h-[450px] sm:h-[500px] max-h-[75vh] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-10 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{t('chat.title')}</h3>
                        <p className="text-xs text-white/80">{t('chat.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <Minimize2 className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950/50">
                {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-base sm:text-lg">
                        <p>{t('chat.greeting')}</p>
                        <p className="mt-2">{t('chat.askAbout')} 「{initialContext.title.slice(0, 10)}...」</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => sendMessage(language === 'en' ? "Explain the key points" : "解釋這篇新聞的重點")}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage(language === 'en' ? "Explain the key points" : "解釋這篇新聞的重點")}
                                className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 cursor-pointer select-none"
                            >
                                {t('chat.suggestExplain')}
                            </span>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => sendMessage(language === 'en' ? "What are the implications?" : "這會有什麼影響？")}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage(language === 'en' ? "What are the implications?" : "這會有什麼影響？")}
                                className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 cursor-pointer select-none"
                            >
                                {t('chat.suggestImpact')}
                            </span>
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex items-start gap-2 sm:gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${m.role === 'user'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            }`}>
                            {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-base sm:text-lg ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none leading-relaxed'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none shadow-sm leading-[1.7] tracking-wide break-words whitespace-pre-wrap'
                                    }`}
                            >
                                {m.content ? (
                                    m.role === 'assistant' ? (
                                        <ReactMarkdown
                                            components={{
                                                p: ({ children }) => <span>{children}</span>,
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    ) : (
                                        m.content
                                    )
                                ) : (isLoading && m.role === 'assistant' ? (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                ) : null)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="relative flex items-center">
                    <input
                        className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-black border focus:border-blue-500 rounded-xl text-base focus:outline-none transition-all"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="輸入您的問題..."
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

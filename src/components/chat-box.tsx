'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';

interface ChatBoxProps {
    initialContext: {
        title: string;
        summary: string;
    };
}

export function ChatBox({ initialContext }: ChatBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Pass context to the API with every request or just initializing logic
    // We can use the 'body' property to send extra data
    const { messages, append, isLoading } = useChat({
        api: '/api/chat',
        body: {
            context: initialContext
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any) as any;

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');
        await append({
            role: 'user',
            content: userMessage,
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-subtle"
            >
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold">AI 導讀</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-96 h-[500px] max-h-[80vh] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-10 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Smart Flow AI</h3>
                        <p className="text-xs text-white/80">隨時為您解答</p>
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
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        <p>👋 你好！我是您的 AI 導讀助手。</p>
                        <p className="mt-2">關於這篇新聞「{initialContext.title.slice(0, 10)}...」，有什麼想問的嗎？</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (isLoading) return;
                                    await append({ role: 'user', content: "解釋這篇新聞的重點" });
                                }}
                                disabled={isLoading}
                                className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                &quot;解釋這篇新聞的重點&quot;
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (isLoading) return;
                                    await append({ role: 'user', content: "這會有什麼影響？" });
                                }}
                                disabled={isLoading}
                                className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                &quot;這會有什麼影響？&quot;
                            </button>
                        </div>
                    </div>
                )}

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {messages.map((m: any) => (
                    <div
                        key={m.id}
                        className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''
                            }`}
                    >
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${m.role === 'user'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            }`}>
                            {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div
                            className={`flex flex-col max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'
                                }`}
                        >
                            <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none shadow-sm'
                                    }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="relative flex items-center">
                    <input
                        className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-black border focus:border-blue-500 rounded-xl text-sm focus:outline-none transition-all"
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

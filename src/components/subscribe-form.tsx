'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function SubscribeForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '訂閱失敗，請稍後再試。');
            }

            setStatus('success');
            setMessage('訂閱成功！感謝您的支持。');
            setEmail('');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div id="subscribe" className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 my-12 text-center max-w-2xl mx-auto transition-colors">
            <div className="flex justify-center mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">訂閱每日 AI 趨勢電子報</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                每天早上 8 點，將最新的 AI 新聞摘要直接寄送到您的信箱。
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                    type="email"
                    required
                    placeholder="您的 Email 地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading' || status === 'success'}
                    className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                />
                <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            處理中
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            已訂閱
                        </>
                    ) : (
                        '訂閱'
                    )}
                </button>
            </form>

            {message && (
                <div className={`mt-4 text-sm flex items-center justify-center gap-2 ${status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {status === 'error' && <AlertCircle className="w-4 h-4" />}
                    {message}
                </div>
            )}
        </div>
    );
}

'use client';

import { createClient } from '@/utils/supabase/client';
import { useLanguage } from './language-context';
import { X } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { language, t } = useLanguage();
    const supabase = createClient();

    if (!isOpen) return null;

    const handleLogin = async (provider: 'google' | 'facebook') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Login error:', error);
            alert(language === 'en' ? 'Login failed. Please try again.' : '登入失敗，請稍後再試。');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {language === 'en' ? 'Welcome Back' : '歡迎回來'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {language === 'en'
                            ? 'Sign in to sync your bookmarks across devices.'
                            : '登入以同步您的收藏並跨裝置存取。'}
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleLogin('google')}
                        className="w-full h-12 flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-900 dark:text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        {language === 'en' ? 'Continue with Google' : '使用 Google 帳號登入'}
                    </button>

                    <button
                        onClick={() => handleLogin('facebook')}
                        className="w-full h-12 flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.603-2.797 4.16v1.957h3.696l-.597 3.667h-3.099v7.98C13.322 23.981 12.169 24 12 24c-.169 0-1.322-.019-2.899-.309z" />
                        </svg>
                        {language === 'en' ? 'Continue with Facebook' : '使用 Facebook 帳號登入'}
                    </button>
                </div>

                <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    {language === 'en' ? 'By continuing, you agree to our Terms and Privacy Policy.' : '繼續即代表您同意我們的服務條款與隱私權政策。'}
                </p>
            </div>
        </div>
    );
}

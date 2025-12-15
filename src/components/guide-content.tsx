'use client';

import { useLanguage } from '@/components/language-context';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Volume2, MessageSquare, Mail } from 'lucide-react';

export function GuideContent() {
    const { t } = useLanguage();

    return (
        <main className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {t('guidePage.back')}
            </Link>

            <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-10">
                <div className="text-center mb-10">
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold mb-4">
                        {t('guidePage.badge')}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        {t('guidePage.title')}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        {t('guidePage.desc')}
                    </p>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none">

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/20 mb-10">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-blue-700 dark:text-blue-300 mt-0">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full text-sm">1</span>
                            {t('guidePage.step1.title')}
                        </h2>
                        <p>{t('guidePage.step1.text')}</p>
                        <ol className="list-decimal pl-5 space-y-2 marker:text-blue-500">
                            <li><strong>{t('guidePage.step1.li1').split('：')[0]}</strong>：{t('guidePage.step1.li1').split('：')[1] || t('guidePage.step1.li1')}</li>
                            <li><strong>{t('guidePage.step1.li2').split('：')[0]}</strong>：{t('guidePage.step1.li2').split('：')[1] || t('guidePage.step1.li2')}</li>
                            <li><strong>{t('guidePage.step1.li3').split('：')[0]}</strong>：{t('guidePage.step1.li3').split('：')[1] || t('guidePage.step1.li3')}</li>
                        </ol>
                        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
                            <img src="/images/guide/welcome.png" alt="Welcome" className="w-full" />
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                            {t('guidePage.step2.title')}
                        </h2>
                        <p>
                            {t('guidePage.step2.text')}
                        </p>
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md my-6">
                            <img src="/images/guide/feed.png" alt="Feed" className="w-full" />
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <Volume2 className="w-6 h-6 text-gray-400" />
                            {t('guidePage.step3.title')}
                        </h2>
                        <p>
                            {t('guidePage.step3.text')}
                        </p>
                        <ul className="space-y-4 my-6">
                            <li className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                    <Volume2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <strong>{t('guidePage.step3.audio')}</strong>
                                    <p className="text-sm text-gray-500 m-0">{t('guidePage.step3.audioDesc')}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <strong>{t('guidePage.step3.chat')}</strong>
                                    <p className="text-sm text-gray-500 m-0">{t('guidePage.step3.chatDesc')}</p>
                                </div>
                            </li>
                        </ul>
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
                            <img src="/images/guide/detail.png" alt="Detail" className="w-full" />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white mt-0">
                            <Mail className="w-6 h-6 text-gray-400" />
                            {t('guidePage.step4.title')}
                        </h2>
                        <p>
                            {t('guidePage.step4.text')}
                        </p>
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md mt-4">
                            <img src="/images/guide/subscribe.png" alt="Subscribe" className="w-full" />
                        </div>
                    </div>

                </div>

                <div className="mt-12 text-center pt-8 border-t border-gray-100 dark:border-gray-800">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                    >
                        {t('guidePage.cta')}
                    </Link>
                </div>
            </article>
        </main>
    );
}
